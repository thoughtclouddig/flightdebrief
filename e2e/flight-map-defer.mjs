// Browser regression coverage for FlightMap's lazy MapLibre boundary.
//
// Runs against a dedicated Next dev server and an isolated Postgres schema.
// The fixture has one completed flight with a usable track and one flight
// without a route. CARTO's style request is fulfilled with a minimal MapLibre
// style so the test is deterministic and does not depend on third-party tiles.
//
// Run with: npm run test:e2e:flight-map
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { chromium } from "@playwright/test";
import { SignJWT } from "jose";
import pg from "pg";

const APP_PORT = 5100;
const APP = `http://127.0.0.1:${APP_PORT}`;
const SCHEMA = "e2e_flight_map";
const DIST_DIR = ".next-e2e-flight-map";
const SESSION_SECRET = process.env.SESSION_SECRET;
const ROUTED_FLIGHT_ID = "flight-map-routed";
const EMPTY_FLIGHT_ID = "flight-map-empty";
const TEST_EMAIL = "flight-map-pilot@e2e.test";
const BASEMAP_STYLE_URL = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (!SESSION_SECRET) throw new Error("SESSION_SECRET is required.");

const testDbUrl = new URL(process.env.DATABASE_URL);
testDbUrl.searchParams.set("options", `-csearch_path=${SCHEMA}`);

const key = new TextEncoder().encode(SESSION_SECRET);
const minimalStyle = JSON.stringify({
  version: 8,
  name: "Flight map E2E",
  sources: {},
  layers: [],
});
let mapLibreChunkPaths = new Set();

function isMapLibreChunk(request) {
  const pathname = new URL(request.url()).pathname;
  return request.resourceType() === "script" && mapLibreChunkPaths.has(pathname);
}

function isBasemapRequest(request) {
  return request.url().startsWith("https://basemaps.cartocdn.com/");
}

async function resetSchema() {
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  await db.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
  await db.query(`CREATE SCHEMA ${SCHEMA}`);
  await db.end();

  const testDb = new pg.Client({ connectionString: testDbUrl.toString() });
  await testDb.connect();
  await testDb.query(await readFile(new URL("../db/schema.sql", import.meta.url), "utf8"));
  await testDb.end();
}

async function dropSchema() {
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  await db.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
  await db.end();
}

function appEnv() {
  return {
    ...process.env,
    PORT: String(APP_PORT),
    APP_BASE_URL: APP,
    DATABASE_URL: testDbUrl.toString(),
    NEXT_DIST_DIR: DIST_DIR,
    FORCE_RESEED: "0",
    SEED_DEMO_DATA: "0",
    SITE_ACCESS_CODE: "",
  };
}

function runBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "build"], {
      env: appEnv(),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    const capture = (data) => {
      output = (output + data.toString()).slice(-20_000);
      if (process.env.E2E_VERBOSE) process.stdout.write(data);
    };
    child.stdout.on("data", capture);
    child.stderr.on("data", capture);
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`production build failed (code ${code})\n${output}`));
    });
  });
}

async function indexMapLibreChunks() {
  const chunkRoot = join(DIST_DIR, "static", "chunks");
  const entries = await readdir(chunkRoot, { recursive: true, withFileTypes: true });
  const paths = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => join(entry.parentPath, entry.name));
  const matches = [];

  for (const path of paths) {
    const source = await readFile(path, "utf8");
    if (source.includes("maplibregl-canvas")) {
      matches.push(`/_next/static/chunks/${relative(chunkRoot, path).replaceAll("\\", "/")}`);
    }
  }
  assert.ok(matches.length > 0, "production build did not contain an identifiable MapLibre chunk");
  mapLibreChunkPaths = new Set(matches);
}

function startApp() {
  const child = spawn("npm", ["run", "start"], {
    env: appEnv(),
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });

  child.stdout.on("data", (data) => {
    if (process.env.E2E_VERBOSE) process.stdout.write(data);
  });
  child.stderr.on("data", (data) => {
    if (process.env.E2E_VERBOSE) process.stderr.write(data);
  });
  return child;
}

async function waitForApp(app, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (app.exitCode !== null) throw new Error(`app exited before becoming ready (code ${app.exitCode})`);
    try {
      const response = await fetch(`${APP}/login`, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error("app did not start in time");
}

async function seedFixtures() {
  const db = new pg.Client({ connectionString: testDbUrl.toString() });
  await db.connect();

  const track = [
    { lat: 33.3078, lon: -111.6555, altitudeFt: 1_500, groundSpeedKt: 75, timestamp: "2026-08-20T15:00:00.000Z" },
    { lat: 33.3501, lon: -111.7102, altitudeFt: 2_800, groundSpeedKt: 102, timestamp: "2026-08-20T15:08:00.000Z" },
    { lat: 33.4202, lon: -111.6854, altitudeFt: 3_200, groundSpeedKt: 108, timestamp: "2026-08-20T15:16:00.000Z" },
  ];
  const result = {
    flightSummary: "A focused local training flight.",
    whatWeDid: ["Practiced pattern work"],
    wentWell: ["Maintained a stable approach"],
    needsWork: ["Refine airspeed control"],
    instructorGuidance: [],
    instructorAssistance: [],
    riskManagementNotes: [],
    assessmentDifferences: [],
    actionItems: ["Brief target speeds before the next flight"],
    nextLessonFocus: ["Airspeed control"],
    studyReferences: [],
  };

  try {
    await db.query("BEGIN");
    await db.query(
      "INSERT INTO organizations (id, name, kind, default_guidance_mode) VALUES ($1, $2, 'individual', 'freeform')",
      ["flight-map-org", "Flight Map E2E"],
    );
    await db.query(
      "INSERT INTO users (id, name, email, auth_user_id, profile_completed) VALUES ($1, $2, $3, $3, true)",
      ["flight-map-user", "Map Pilot", TEST_EMAIL],
    );
    await db.query(
      "INSERT INTO organization_members (id, organization_id, user_id, role) VALUES ($1, $2, $3, 'student')",
      ["flight-map-membership", "flight-map-org", "flight-map-user"],
    );
    await db.query(
      `INSERT INTO aircraft
        (id, tail_number, type, make, model, home_airport, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ["flight-map-aircraft", "N5100E", "Airplane", "Cessna", "172S", "KFFZ", "flight-map-org"],
    );
    await db.query(
      `INSERT INTO flights
        (id, student_id, organization_id, aircraft_id, departure_airport, arrival_airport,
         flight_date, duration_minutes, debrief_status, track)
       VALUES
        ($1, $3, $4, $5, 'KFFZ', 'KFFZ', '2026-08-20', 52, 'complete', $6),
        ($2, $3, $4, $5, 'KFFZ', 'KCHD', '2026-08-19', 38, 'not_started', NULL)`,
      [ROUTED_FLIGHT_ID, EMPTY_FLIGHT_ID, "flight-map-user", "flight-map-org", "flight-map-aircraft", JSON.stringify(track)],
    );
    await db.query(
      `INSERT INTO debriefs
        (id, flight_id, transcript, audio_duration_seconds, structured_result, analyzed_with)
       VALUES ($1, $2, $3, 180, $4, 'mock')`,
      ["flight-map-debrief", ROUTED_FLIGHT_ID, "A concise completed debrief.", JSON.stringify(result)],
    );
    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    await db.end();
  }
}

async function mintSession() {
  return new SignJWT({
    email: TEST_EMAIL,
    name: "Map Pilot",
    purpose: "session",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(TEST_EMAIL)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1_000) + 3_600)
    .sign(key);
}

async function createContext(browser, session) {
  const context = await browser.newContext({ viewport: { width: 390, height: 720 } });
  await context.addCookies([
    {
      name: "fb_session",
      value: session,
      url: APP,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await context.addInitScript(() => {
    const moveMapBelowObserverMargin = () => {
      document.querySelectorAll('[data-testid="flight-map"]').forEach((map) => {
        map.style.setProperty("margin-top", "1600px", "important");
      });
    };
    const observer = new MutationObserver(moveMapBelowObserverMargin);
    observer.observe(document, { childList: true, subtree: true });
    document.addEventListener("DOMContentLoaded", () => {
      moveMapBelowObserverMargin();
      observer.disconnect();
    });
  });
  await context.route(BASEMAP_STYLE_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: minimalStyle,
    }),
  );
  return context;
}

async function verifyDeferredMap(browser, session, { path, activation, label }) {
  const context = await createContext(browser, session);
  const page = await context.newPage();
  const requests = [];
  page.on("request", (request) => requests.push(request));

  try {
    await page.goto(`${APP}${path}`, { waitUntil: "networkidle" });
    const map = page.getByTestId("flight-map");
    await map.getByText("Route preview", { exact: true }).waitFor({ state: "attached" });
    await page.waitForTimeout(750);

    const initialMapRequests = requests.filter((request) => isMapLibreChunk(request) || isBasemapRequest(request));
    assert.equal(
      initialMapRequests.some(isMapLibreChunk),
      false,
      `${label}: MapLibre loaded before the map was requested or near the viewport (${initialMapRequests.map((request) => request.url()).join(", ")})`,
    );
    assert.equal(
      requests.some(isBasemapRequest),
      false,
      `${label}: the basemap loaded before the map was requested or near the viewport`,
    );

    const mapLibreRequest = page.waitForRequest(isMapLibreChunk);
    const styleRequest = page.waitForRequest((request) => request.url() === BASEMAP_STYLE_URL);

    if (activation === "click") {
      await map.getByRole("button", { name: "Load interactive map" }).evaluate((button) => button.click());
    } else {
      await map.scrollIntoViewIfNeeded();
    }

    await Promise.all([mapLibreRequest, styleRequest]);
    await map.locator("canvas.maplibregl-canvas").waitFor({ state: "visible" });
    await page.waitForFunction(
      () => document.querySelector('[data-testid="flight-map"]')?.getAttribute("aria-busy") === "false",
    );
    assert.equal(await map.getAttribute("aria-busy"), "false", `${label}: interactive map did not finish loading`);
    console.log(`  ok - ${label} defers and then renders MapLibre via ${activation}`);
  } finally {
    await context.close();
  }
}

async function verifyEmptyState(browser, session) {
  const context = await createContext(browser, session);
  const page = await context.newPage();
  const requests = [];
  page.on("request", (request) => requests.push(request));

  try {
    await page.goto(`${APP}/flights/${EMPTY_FLIGHT_ID}`, { waitUntil: "networkidle" });
    await page.getByText("No track data available for this flight.", { exact: true }).waitFor();
    assert.equal(await page.getByTestId("flight-map").count(), 0, "empty flight unexpectedly rendered a map");
    assert.equal(requests.some(isMapLibreChunk), false, "empty flight requested MapLibre");
    assert.equal(requests.some(isBasemapRequest), false, "empty flight requested the basemap");
    console.log("  ok - flight without a usable route keeps the empty state");
  } finally {
    await context.close();
  }
}

let app;
let browser;

try {
  await resetSchema();
  await seedFixtures();
  await runBuild();
  await indexMapLibreChunks();
  app = startApp();
  await waitForApp(app);
  const session = await mintSession();
  browser = await chromium.launch({ headless: true });

  await verifyDeferredMap(browser, session, {
    path: `/flights/${ROUTED_FLIGHT_ID}`,
    activation: "click",
    label: "flight detail",
  });
  await verifyDeferredMap(browser, session, {
    path: `/flights/${ROUTED_FLIGHT_ID}/debrief/results`,
    activation: "scroll",
    label: "debrief results",
  });
  await verifyEmptyState(browser, session);
} finally {
  await browser?.close().catch(() => {});
  if (app) {
    try {
      process.kill(-app.pid, "SIGKILL");
    } catch {
      app.kill("SIGKILL");
    }
  }
  await dropSchema().catch((error) => console.error("Failed to clean up E2E schema:", error.message));
}

console.log("\n3 passed, 0 failed");
process.exit(0);