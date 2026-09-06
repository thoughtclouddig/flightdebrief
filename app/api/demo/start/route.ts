import { after, NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/auth/origin";
import { createSessionJwt, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, V2_REAL_DATA_COOKIE } from "@/lib/auth/session";
import { cleanupExpiredDemoOrgs, seedCfiSchoolDemo, seedPilotDemo } from "@/lib/demo/live-demo-seed";
import { DEMO_HINT_COOKIE } from "@/lib/demo/live-demo-jobs";
import { isDevelopment } from "@/lib/env";

/** The curated Student product demo -- see app/demo/student/layout.tsx. */
const STUDENT_DEMO_PATH = "/demo/student";

const DEMO_ORG_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// Next.js caches GET route handlers by default unless they read a dynamic
// API (cookies()/headers()) or explicitly opt out -- reading
// request.nextUrl.searchParams does NOT count as an opt-out. Without this,
// the very first response (say, for ?persona=cfi) can get served back for
// every later request regardless of query string, including different
// personas -- exactly the "clicked Pilot, landed on the CFI account" bug.
export const dynamic = "force-dynamic";

/**
 * Public entry point for the marketing site's "try it live" demo -- unlike
 * app/api/auth/dev-login and app/api/demo/enter (both internal-only, gated
 * behind !REPLIT_DEPLOYMENT), this route is meant to run in real production.
 * Provisions a fresh, isolated org+users+data on every visit (see
 * lib/demo/live-demo-seed.ts), mints a real session for the seeded persona,
 * and redirects straight into the product. The seed writes are deliberately
 * batched so this reliable request-bound flow does not depend on an in-memory
 * background job surviving across autoscaled instances.
 *
 * The pilot persona is the curated Student product demo -- Mia, not a real
 * account. It makes zero database writes: no org, no user, no session, no
 * cookie, just a deterministic redirect to /demo/student, identical in
 * Development, Staging, and Production. This used to seed a real ephemeral
 * Jordan org and mint a real session before landing on /home (or, briefly,
 * real-data /v2 in development) -- that entire path is gone for this
 * persona now that the curated demo doesn't need a database at all.
 *
 * pilot-real is the separate, Development-only real-data QA entry (invalid
 * persona outside development) that still does what pilot used to: seeds a
 * real Jordan org, mints a real session, enables real-data /v2. Backend/
 * lifecycle QA only, never the curated demo -- Mia (fixture) and Jordan
 * (real-data QA) are deliberately not the same persona and must not be
 * conflated. CFI and school personas are completely unchanged.
 */
export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);
  const persona = request.nextUrl.searchParams.get("persona");

  if (persona === "pilot") {
    return NextResponse.redirect(`${origin}${STUDENT_DEMO_PATH}`);
  }

  if (persona !== "pilot-real" && persona !== "cfi" && persona !== "school") {
    return NextResponse.json({ error: "Invalid persona. Use ?persona=pilot|cfi|school." }, { status: 400 });
  }
  if (persona === "pilot-real" && !isDevelopment()) {
    return NextResponse.json({ error: "Invalid persona. Use ?persona=pilot|cfi|school." }, { status: 400 });
  }

  try {
    after(async () => {
      try {
        await cleanupExpiredDemoOrgs();
      } catch (err) {
        console.error("Expired demo cleanup failed:", err);
      }
    });

    const expiresAt = new Date(Date.now() + DEMO_ORG_TTL_MS);
    const result = persona === "pilot-real" ? await seedPilotDemo(expiresAt) : await seedCfiSchoolDemo(persona, expiresAt);

    const jwt = await createSessionJwt({ sub: result.loginEmail, email: result.loginEmail, name: result.loginName });
    // pilot-real is the only remaining persona that enables real-data /v2
    // (validated Development-only above) -- backend/lifecycle QA, not the
    // product demo.
    const v2RealData = persona === "pilot-real";
    const response = NextResponse.redirect(`${origin}${v2RealData ? "/v2" : result.redirectPath}`);
    response.cookies.set(SESSION_COOKIE, jwt, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    response.cookies.set(DEMO_HINT_COOKIE, result.hint, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: DEMO_ORG_TTL_MS / 1000,
    });
    if (v2RealData) {
      response.cookies.set(V2_REAL_DATA_COOKIE, "1", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      });
    }
    return response;
  } catch (err) {
    console.error("Live demo provisioning failed:", err);
    return NextResponse.json({ error: "Couldn't start the demo. Please try again." }, { status: 500 });
  }
}
