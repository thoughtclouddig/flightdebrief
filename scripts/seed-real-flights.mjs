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
//   FR24_API_KEY=... DATABASE_URL=... node scripts/seed-real-flights.mjs --callsign=OXF
//   Add --airport=KXYZ to require a different airport than the default
//   (Falcon Aviation's home base, matching the org's existing seeded
//   aircraft); --airport=ANY disables the filter entirely.
//
//   --callsign=OXF searches FR24's `callsigns` filter (confirmed as a real
//   flight-summary parameter via FR24's own API MCP server source -- their
//   rendered docs page didn't return readable content when fetched). Whether
//   it accepts a bare prefix like "OXF" or requires the exact full callsign
//   is NOT confirmed from available docs -- this is exploratory; if it comes
//   back empty, try a full callsign (e.g. OXF123) instead of just the
//   3-letter operator prefix.
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
const callsignArgs = rawArgs.filter((a) => a.startsWith("--callsign=")).map((a) => a.slice("--callsign=".length).toUpperCase());
const tailNumbers = rawArgs.filter((a) => !a.startsWith("--")).map((t) => t.toUpperCase());

// Each search term is either {mode: "registration", value} (an aircraft's
// tail number) or {mode: "callsign", value} (an operator/flight prefix,
// e.g. a flight school's callsign like OXF) -- see searchFlights below.
const searchTerms = [
  ...tailNumbers.map((value) => ({ mode: "registration", value })),
  ...callsignArgs.map((value) => ({ mode: "callsign", value })),
];
if (searchTerms.length === 0) {
  console.error("Usage: node scripts/seed-real-flights.mjs <TAIL1> [TAIL2] ... [--callsign=OXF] [--airport=KFFZ]");
  process.exit(1);
}
console.log(
  requiredAirport === "ANY"
    ? "[seed-real-flights] No airport filter -- keeping every real flight found."
    : `[seed-real-flights] Only keeping real flights that depart or arrive at ${requiredAirport}.`,
);

const FR24_BASE_URL = "https://fr24api.flightradar24.com";
const ORG_FALCON_ID = "org-falcon";
const INSTRUCTOR_ID = "user-danny"; // Danny -- Falcon's seeded CFI
const STUDENT_ID = "user-andy"; // Andy -- Falcon's seeded student, already linked to Danny

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Retries 429s with backoff (1s, 2s, 4s, 8s) -- flight-tracks calls easily trip FR24's rate limit when a tail number has many real flights. */
async function fr24Request(path, params, attempt = 0) {
  const url = new URL(path, FR24_BASE_URL);
  for (const [key, value] of Object.entries(params ?? {})) url.searchParams.set(key, value);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${fr24ApiKey}`, Accept: "application/json", "Accept-Version": "v1" },
  });
  if (res.status === 429 && attempt < 4) {
    const waitMs = 1000 * 2 ** attempt;
    console.log(`[seed-real-flights] Rate limited, waiting ${waitMs}ms before retrying...`);
    await sleep(waitMs);
    return fr24Request(path, params, attempt + 1);
  }
  if (!res.ok) throw new Error(`FR24 request failed (${res.status}): ${await res.text()}`);
  return res.json();
}

/** Same 14-day window FR24Provider.searchFlightsByTailNumber uses -- flight-summary requires a bounded range. */
async function searchFlights(term) {
  const now = new Date();
  const from = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const toFr24Datetime = (d) => d.toISOString().replace(/\.\d{3}Z$/, "");
  const filterParam = term.mode === "callsign" ? "callsigns" : "registrations";
  const data = await fr24Request("/api/flight-summary/full", {
    [filterParam]: term.value,
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
  for (const term of searchTerms) {
    console.log(`[seed-real-flights] Searching FR24 for ${term.mode} ${term.value}...`);
    const summaries = await searchFlights(term);
    if (summaries.length === 0) {
      console.log(`[seed-real-flights] No flights found for ${term.mode} ${term.value} in the last 14 days.`);
      continue;
    }

    for (const s of summaries) {
      // The real registration, per FR24 -- not the search term itself, since
      // a callsign search can match multiple different real aircraft.
      const tailNumber = (s.reg ?? term.value).toUpperCase();
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

      const alreadySeeded = await client.query("SELECT 1 FROM flights WHERE fr24_flight_id = $1", [s.fr24_id]);
      if (alreadySeeded.rows.length > 0) {
        console.log(`[seed-real-flights] ${tailNumber} / ${s.fr24_id}: already seeded, skipping.`);
        continue;
      }

      // Small pacing delay before each track fetch -- proactive, on top of
      // fr24Request's reactive 429 backoff, since a single tail number with
      // many real flights (a busy training aircraft) can otherwise fire off
      // a dozen track requests back to back.
      await sleep(400);

      let track;
      try {
        track = await getFlightTrack(s.fr24_id);
      } catch (err) {
        // One flight failing (rate limit exhausted after retries, or any
        // other transient FR24 error) should not kill the whole batch --
        // log it and move on to the next real flight.
        console.error(`[seed-real-flights] ${tailNumber} / ${s.fr24_id}: track fetch failed (${err.message}), skipping.`);
        continue;
      }
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
