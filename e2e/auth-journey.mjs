// End-to-end verification of the whole magic-link login journey. Instead of
// clicking emailed links, the suite mints magic-link tokens directly with the
// same signing function the login route uses (HS256, SESSION_SECRET, purpose
// claim) and walks /api/auth/callback. Runs against its own Next dev server
// on a dedicated port, with the identity tables isolated in a throwaway
// Postgres schema (search_path=e2e_auth) so the real dev data is untouched.
//
// Covers: owner bootstrap -> admin (incl. one-time profile completion),
// admin invites student/CFI, invited email links on first login, non-invited
// login rejected, expired/garbage token rejected, logout, deactivated member
// losing API access, and no double-bootstrap.
//
// Run with: npm run test:e2e:auth
import { spawn } from "node:child_process";
import pg from "pg";
import { SignJWT } from "jose";

const APP_PORT = 5099;
const APP = `http://127.0.0.1:${APP_PORT}`;
const SCHEMA = "e2e_auth";
const SECRET = process.env.SESSION_SECRET;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (!SECRET) throw new Error("SESSION_SECRET is required.");
const testDbUrl = new URL(process.env.DATABASE_URL);
testDbUrl.searchParams.set("options", `-csearch_path=${SCHEMA}`);

// ---------- tiny test framework ----------
let passed = 0;
const failures = [];
function check(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ok - ${name}`);
  } else {
    failures.push(name);
    console.error(`  FAIL - ${name}${detail ? ` (${detail})` : ""}`);
  }
}

// ---------- magic-link token minting (mirrors lib/auth/session.ts) ----------
const key = new TextEncoder().encode(SECRET);
async function mintMagicLink(email, { expiresInSeconds = 900, purpose = "magic-link" } = {}) {
  return new SignJWT({ purpose })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email.trim().toLowerCase())
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .sign(key);
}

// ---------- cookie-jar fetch client (one per persona) ----------
function makeClient() {
  const jar = new Map();
  function setCookies(res) {
    for (const line of res.headers.getSetCookie?.() ?? []) {
      const [pair] = line.split(";");
      const eq = pair.indexOf("=");
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      const expired = /max-age=0|expires=thu, 01 jan 1970/i.test(line);
      if (expired || value === "") jar.delete(name);
      else jar.set(name, value);
    }
  }
  function cookieHeader() {
    return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
  // The app builds redirects on the https external origin; rewrite them back
  // to our local http test server.
  function localize(u) {
    return u.replace(`https://127.0.0.1:${APP_PORT}`, APP);
  }
  async function get(url, { follow = 0 } = {}) {
    let current = localize(url);
    let res;
    for (let i = 0; i <= follow; i++) {
      res = await fetch(current, {
        redirect: "manual",
        headers: { cookie: cookieHeader() },
      });
      setCookies(res);
      const loc = res.headers.get("location");
      if (!loc || i === follow) break;
      current = localize(new URL(loc, current).toString());
    }
    return res;
  }
  async function post(url, body) {
    const res = await fetch(localize(url), {
      method: "POST",
      redirect: "manual",
      headers: { cookie: cookieHeader(), "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setCookies(res);
    return res;
  }
  async function patch(url, body) {
    const res = await fetch(localize(url), {
      method: "PATCH",
      redirect: "manual",
      headers: { cookie: cookieHeader(), "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setCookies(res);
    return res;
  }
  return { get, post, patch, jar };
}

/** Full magic-link login: mint the token and hit the callback. */
async function login(client, email, opts) {
  const token = await mintMagicLink(email, opts);
  return client.get(`${APP}/api/auth/callback?token=${encodeURIComponent(token)}`);
}

// ---------- environment orchestration ----------
async function resetSchema() {
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  await db.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
  await db.query(`CREATE SCHEMA ${SCHEMA}`);
  await db.end();
}

function startApp() {
  const child = spawn("npm", ["run", "dev"], {
    env: {
      ...process.env,
      PORT: String(APP_PORT),
      // Auth redirects prefer the server-configured origin; point it at the
      // test app so localize() can rewrite it back to http://127.0.0.1.
      APP_BASE_URL: `https://127.0.0.1:${APP_PORT}`,
      DATABASE_URL: testDbUrl.toString(),
      NEXT_DIST_DIR: ".next-e2e",
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true, // own process group, so we can kill npm + next together
  });
  child.stdout.on("data", (d) => process.env.E2E_VERBOSE && process.stdout.write(d));
  child.stderr.on("data", (d) => process.env.E2E_VERBOSE && process.stderr.write(d));
  return child;
}

async function waitForApp(timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${APP}/login`, { redirect: "manual" });
      if (res.status < 500) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("app did not start in time");
}

// ---------- the journey ----------
const OWNER = "owner@e2e.test";
const STUDENT = "student@e2e.test";
const CFI = "cfi@e2e.test";
const RANDO = "rando@e2e.test";

await resetSchema();
const app = startApp();
const testDb = new pg.Client({ connectionString: testDbUrl.toString() });

try {
  await waitForApp();
  await testDb.connect();

  console.log("\n1) First-ever login bootstraps the owner as admin (via profile completion)");
  const owner = makeClient();
  const res1 = await login(owner, OWNER);
  check("first login redirects to onboarding", res1.headers.get("location")?.includes("/onboarding"), res1.headers.get("location") ?? String(res1.status));
  check("session cookie set", owner.jar.has("fb_session"));
  const { rows: ownerRows } = await testDb.query(
    "SELECT u.id, u.profile_completed, m.role, m.status FROM users u JOIN organization_members m ON m.user_id = u.id WHERE u.auth_user_id = $1",
    [OWNER],
  );
  check("owner user linked to email with admin role", ownerRows[0]?.role === "admin" && ownerRows[0]?.status === "active");
  check("owner profile not yet completed", ownerRows[0]?.profile_completed === false);
  const onboardingPage = await owner.get(`${APP}/onboarding`);
  check("onboarding page loads for incomplete profile", onboardingPage.status === 200, `status ${onboardingPage.status}`);
  const completeRes = await owner.post(`${APP}/api/auth/onboarding`, { name: "Olive Owner" });
  check("profile completion succeeds", completeRes.status === 200, `status ${completeRes.status}`);
  const { rows: ownerAfter } = await testDb.query("SELECT name, profile_completed FROM users WHERE auth_user_id = $1", [OWNER]);
  check("name saved and profile marked complete", ownerAfter[0]?.name === "Olive Owner" && ownerAfter[0]?.profile_completed === true);
  const homeRes = await owner.get(`${APP}/app`, { follow: 1 });
  check("owner can load a protected page", homeRes.status === 200, `status ${homeRes.status}`);
  const res1b = await login(owner, OWNER);
  check("returning owner skips onboarding", res1b.headers.get("location")?.includes("/app"), res1b.headers.get("location") ?? "");

  console.log("\n2) Admin invites a student and a CFI");
  const inviteRes = await owner.post(`${APP}/api/admin/invite-student`, { name: "Sam Student", email: STUDENT });
  check("invite-student succeeds", inviteRes.status === 200, `status ${inviteRes.status}`);
  const invitedStudent = (await inviteRes.json()).user;
  const inviteCfiRes = await owner.post(`${APP}/api/admin/invite-cfi`, { name: "Cass Instructor", email: CFI });
  check("invite-cfi succeeds", inviteCfiRes.status === 200, `status ${inviteCfiRes.status}`);
  const { rows: preLink } = await testDb.query("SELECT auth_user_id FROM users WHERE lower(email) = lower($1)", [STUDENT]);
  check("invited user exists with no auth link yet", preLink.length === 1 && preLink[0].auth_user_id === null);

  console.log("\n3) Invited email links on first login and goes through onboarding");
  const student = makeClient();
  const res3 = await login(student, STUDENT);
  check("student first login redirects to onboarding", res3.headers.get("location")?.includes("/onboarding"), res3.headers.get("location") ?? "");
  const { rows: linked } = await testDb.query("SELECT id, auth_user_id, name FROM users WHERE lower(email) = lower($1)", [STUDENT]);
  check("student row linked to email anchor", linked[0]?.auth_user_id === STUDENT);
  check("linked row kept the invite-time id (shared across stores)", linked[0]?.id === invitedStudent.id, `${linked[0]?.id} vs ${invitedStudent.id}`);
  check("invite-time name pre-fills onboarding", linked[0]?.name === "Sam Student");
  const studentComplete = await student.post(`${APP}/api/auth/onboarding`, { name: "Samantha Student" });
  check("student completes profile with edited name", studentComplete.status === 200);
  const res3b = await login(student, STUDENT);
  check("returning student skips onboarding", res3b.headers.get("location")?.includes("/app"));
  const cfi = makeClient();
  const resCfi = await login(cfi, CFI);
  check("CFI first login redirects to onboarding", resCfi.headers.get("location")?.includes("/onboarding"));
  await cfi.post(`${APP}/api/auth/onboarding`, { name: "Cass Instructor" });
  const { rows: cfiRole } = await testDb.query(
    "SELECT m.role FROM users u JOIN organization_members m ON m.user_id = u.id WHERE u.auth_user_id = $1",
    [CFI],
  );
  check("CFI has instructor role", cfiRole[0]?.role === "instructor");

  console.log("\n4) Non-invited email is rejected with the right message");
  const rando = makeClient();
  const res4 = await login(rando, RANDO);
  check("rejected redirect goes to /login?error=not-invited", res4.headers.get("location")?.includes("/login?error=not-invited"), res4.headers.get("location") ?? "");
  check("no session cookie for rejected login", !rando.jar.has("fb_session"));
  const loginPage = await rando.get(`${APP}/login?error=not-invited`);
  const loginHtml = await loginPage.text();
  check("login page shows the not-invited message", loginHtml.includes("isn&#x27;t linked to an AfterFlight profile") || loginHtml.includes("isn't linked to an AfterFlight profile"));
  const { rows: randoRows } = await testDb.query("SELECT 1 FROM users WHERE auth_user_id = $1 OR lower(email) = lower($1)", [RANDO]);
  check("no user row created for rejected login", randoRows.length === 0);

  console.log("\n5) Invalid, expired, and wrong-purpose tokens are rejected");
  const bad = makeClient();
  const resGarbage = await bad.get(`${APP}/api/auth/callback?token=garbage`);
  check("garbage token redirects to /login?error=expired", resGarbage.headers.get("location")?.includes("error=expired"), resGarbage.headers.get("location") ?? "");
  const resExpired = await login(bad, OWNER, { expiresInSeconds: -60 });
  check("expired token rejected", resExpired.headers.get("location")?.includes("error=expired"));
  const resWrongPurpose = await login(bad, OWNER, { purpose: "session" });
  check("wrong-purpose token rejected", resWrongPurpose.headers.get("location")?.includes("error=expired"));
  check("no session cookie from bad tokens", !bad.jar.has("fb_session"));

  console.log("\n6) Logout clears the session");
  const cfiLogout = await cfi.get(`${APP}/api/auth/logout`);
  check("logout redirects", [302, 307].includes(cfiLogout.status), `status ${cfiLogout.status}`);
  check("session cookie cleared", !cfi.jar.has("fb_session"));
  const afterLogout = await cfi.get(`${APP}/app`);
  check("protected page redirects to /login after logout", afterLogout.headers.get("location")?.includes("/login") ?? false, `status ${afterLogout.status}`);

  console.log("\n7) Deactivated member loses access (student), non-admin cannot manage members");
  const preDeactivate = await student.get(`${APP}/api/flights/search?tail=N12345`);
  check("active student passes API auth", preDeactivate.status !== 401 && preDeactivate.status !== 403, `status ${preDeactivate.status}`);
  const forbidden = await student.patch(`${APP}/api/admin/members`, { memberId: "whatever", status: "inactive" });
  check("student cannot call admin members API", forbidden.status === 403, `status ${forbidden.status}`);
  const { rows: memberRow } = await testDb.query(
    "SELECT m.id FROM organization_members m JOIN users u ON u.id = m.user_id WHERE u.auth_user_id = $1",
    [STUDENT],
  );
  const deactivate = await owner.patch(`${APP}/api/admin/members`, { memberId: memberRow[0].id, status: "inactive" });
  check("admin deactivates the student", deactivate.status === 200, `status ${deactivate.status}`);
  const postDeactivate = await student.get(`${APP}/api/flights/search?tail=N12345`);
  check("deactivated student is rejected by API auth", postDeactivate.status === 401, `status ${postDeactivate.status}`);
  const reactivate = await owner.patch(`${APP}/api/admin/members`, { memberId: memberRow[0].id, status: "active" });
  check("admin reactivates the student", reactivate.status === 200);
  const postReactivate = await student.get(`${APP}/api/flights/search?tail=N12345`);
  check("reactivated student regains access", postReactivate.status !== 401, `status ${postReactivate.status}`);

  console.log("\n8) Second non-linked login after bootstrap is still rejected (no double-bootstrap)");
  const rando2 = makeClient();
  const res8 = await login(rando2, "rando2@e2e.test");
  check("second unknown email also rejected", res8.headers.get("location")?.includes("error=not-invited"));
  const { rows: adminCount } = await testDb.query("SELECT count(*)::int AS n FROM organization_members WHERE role = 'admin' AND user_id IN (SELECT id FROM users WHERE auth_user_id IS NOT NULL)");
  check("exactly one bootstrapped admin", adminCount[0].n === 1, `count ${adminCount[0].n}`);

  console.log("\n9) Login request endpoint never leaks account existence");
  const anon = makeClient();
  const known = await anon.post(`${APP}/api/auth/login`, { email: OWNER });
  const unknown = await anon.post(`${APP}/api/auth/login`, { email: "nobody@e2e.test" });
  check("known email returns ok", known.status === 200);
  check("unknown email returns identical ok", unknown.status === 200);
  const knownBody = JSON.stringify(await known.json());
  const unknownBody = JSON.stringify(await unknown.json());
  check("responses are identical", knownBody === unknownBody, `${knownBody} vs ${unknownBody}`);
} finally {
  await testDb.end().catch(() => {});
  // Kill the whole npm/next process group; SIGTERM alone leaves next alive.
  try {
    process.kill(-app.pid, "SIGKILL");
  } catch {
    app.kill("SIGKILL");
  }
}

console.log(`\n${passed} passed, ${failures.length} failed`);
// Exit explicitly -- lingering sockets from the dev server would otherwise
// keep the event loop (and any CI runner) hanging after a green run.
process.exit(failures.length ? 1 : 0);
