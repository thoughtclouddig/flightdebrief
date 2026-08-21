// Pulls REAL historical ADS-B flights from FlightRadar24 for one or more real
// tail numbers and writes them straight into Postgres as real Flight rows
// for Danny (CFI) / Andy (student) at Falcon Aviation -- the exact same FR24
// endpoints and response shapes as lib/flight-data/fr24-provider.ts (which
// the real /flights/new search UI uses), just scripted end-to-end instead of
// searching/confirming one tail number at a time by hand.
//
// Not run automatically -- invoke by hand, on Replit (needs both
// DATABASE_URL and a real FR24_API_KEY; this sandbox has neither).
//
// Usage:
//   FR24_API_KEY=... DATABASE_URL=... node scripts/seed-real-flights.mjs N123AB N456CD
//   Add --airport=KXYZ to require a different airport than the default
//   (Falcon Aviation's home base, matching the org's existing seeded
//   aircraft); --airport=ANY disables the filter entirely.
import pg from "pg";
import { randomUUID } from "node:crypto";

const connectionString = process.env.DATABASE_URL;
const fr24ApiKey = process.env.FR24_API_KEY;
if (!connectionString) {
  console.error("[seed-real-flights] DATABASE_URL is not set.");
  process.exit(1);
}
if (!fr24ApiKey) {
  console.error("[seed-real-flights] FR24_API_KEY is not set -- this script needs the real key, not the mock fallback.");
  process.exit(1);
}
if (process.env.REPLIT_DEPLOYMENT) {
  console.error("[seed-real-flights] Refusing to run against a deployment. Dev database only.");
  process.exit(1);
}

const rawArgs = process.argv.slice(2);
const airportArg = rawArgs.find((a) => a.startsWith("--airport="));
const requiredAirport = (airportArg ? airportArg.slice("--airport=".length) : "KFFZ").toUpperCase();
const tailNumbers = rawArgs.filter((a) => !a.startsWith("--")).map((t) => t.toUpperCase());
if (tailNumbers.length === 0) {
  console.error("Usage: node scripts/seed-real-flights.mjs <TAIL1> [TAIL2] ... [--airport=KFFZ]");
  process.exit(1);
}
console.log(
  requiredAirport === "ANY"
    ? "[seed-real-flights] No airport filter -- keeping every real flight found for these tail numbers."
    : `[seed-real-flights] Only keeping real flights that depart or arrive at ${requiredAirport}.`,
);

const FR24_BASE_URL = "https://fr24api.flightradar24.com";
const ORG_FALCON_ID = "org-falcon";
const INSTRUCTOR_ID = "user-danny"; // Danny -- Falcon's seeded CFI
const STUDENT_ID = "user-andy"; // Andy -- Falcon's seeded student, already linked to Danny

async function fr24Request(path, params) {
  const url = new URL(path, FR24_BASE_URL);
  for (const [key, value] of Object.entries(params ?? {})) url.searchParams.set(key, value);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${fr24ApiKey}`, Accept: "application/json", "Accept-Version": "v1" },
  });
  if (!res.ok) throw new Error(`FR24 request failed (${res.status}): ${await res.text()}`);
  return res.json();
}

/** Same 14-day window FR24Provider.searchFlightsByTailNumber uses -- flight-summary requires a bounded range. */
async function searchFlightsByTailNumber(tailNumber) {
  const now = new Date();
  const from = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const toFr24Datetime = (d) => d.toISOString().replace(/\.\d{3}Z$/, "");
  const data = await fr24Request("/api/flight-summary/full", {
    registrations: tailNumber,
    flight_datetime_from: toFr24Datetime(from),
    flight_datetime_to: toFr24Datetime(now),
    limit: "10",
  });
  return data.data ?? [];
}

async function getFlightTrack(fr24Id) {
  const data = await fr24Request("/api/flight-tracks", { flight_id: fr24Id });
  const tracks = data[0]?.tracks ?? [];
  return tracks.map((p) => ({
    lat: p.lat,
    lon: p.lon,
    altitudeFt: p.alt,
    groundSpeedKt: p.gspeed,
    timestamp: p.timestamp,
  }));
}

async function getOrCreateAircraft(client, tailNumber, type, homeAirport) {
  const existing = await client.query("SELECT id FROM aircraft WHERE upper(tail_number) = upper($1)", [tailNumber]);
  if (existing.rows[0]) return existing.rows[0].id;
  const id = `aircraft-${randomUUID()}`;
  await client.query(
    `INSERT INTO aircraft (id, tail_number, type, make, model, home_airport, organization_id, status)
     VALUES ($1,$2,$3,'','',$4,$5,'active')`,
    [id, tailNumber, type ?? "Unknown", homeAirport ?? "", ORG_FALCON_ID],
  );
  return id;
}

const client = new pg.Client({ connectionString });
await client.connect();

try {
  let totalCreated = 0;
  for (const tailNumber of tailNumbers) {
    console.log(`[seed-real-flights] Searching FR24 for ${tailNumber}...`);
    const summaries = await searchFlightsByTailNumber(tailNumber);
    if (summaries.length === 0) {
      console.log(`[seed-real-flights] No flights found for ${tailNumber} in the last 14 days.`);
      continue;
    }

    for (const s of summaries) {
      const orig = (s.orig_icao ?? "").toUpperCase();
      const dest = (s.dest_icao ?? "").toUpperCase();
      if (requiredAirport !== "ANY" && orig !== requiredAirport && dest !== requiredAirport) {
        console.log(`[seed-real-flights] ${tailNumber} / ${s.fr24_id}: ${orig || "?"}->${dest || "?"} does not touch ${requiredAirport}, skipping.`);
        continue;
      }

      const takeoff = s.datetime_takeoff ?? null;
      const landed = s.datetime_landed ?? null;
      if (!takeoff) continue; // no real timing data to build a Flight from
      const durationMinutes = landed
        ? Math.max(1, Math.round((new Date(landed).getTime() - new Date(takeoff).getTime()) / 60000))
        : 60;

      const track = await getFlightTrack(s.fr24_id);
      if (track.length === 0) {
        console.log(`[seed-real-flights] ${tailNumber} / ${s.fr24_id}: no track points returned, skipping.`);
        continue;
      }

      const aircraftId = await getOrCreateAircraft(client, tailNumber, s.type, s.orig_icao);
      const flightId = `flight-real-${randomUUID()}`;
      const flightDate = takeoff.slice(0, 10);

      await client.query(
        `INSERT INTO flights (
           id, student_id, organization_id, aircraft_id, departure_airport, arrival_airport,
           flight_date, duration_minutes, instructor_id, fr24_flight_id, external_provider,
           debrief_status, track, created_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'fr24','not_started',$11,$12)
         ON CONFLICT (id) DO NOTHING`,
        [
          flightId, STUDENT_ID, ORG_FALCON_ID, aircraftId,
          s.orig_icao || "UNKNOWN", s.dest_icao || "UNKNOWN",
          flightDate, durationMinutes, INSTRUCTOR_ID, s.fr24_id,
          JSON.stringify(track), new Date(takeoff).toISOString(),
        ],
      );
      totalCreated++;
      console.log(
        `[seed-real-flights] Created ${flightId}: ${tailNumber} ${s.orig_icao}->${s.dest_icao} on ${flightDate} (${track.length} real track points)`,
      );
    }
  }

  console.log(`[seed-real-flights] Done. Created ${totalCreated} real flight(s) for Danny/Andy at Falcon Aviation.`);
  console.log("[seed-real-flights] All left as not_started -- debrief them live in the app for full authenticity.");
} finally {
  await client.end();
}
