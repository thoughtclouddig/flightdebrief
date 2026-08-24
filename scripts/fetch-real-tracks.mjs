// One-time fixture generator: fetches REAL recent flights (route, date,
// duration, tail number, GPS track) from FR24 for a small set of real
// training aircraft and bundles them into lib/demo/real-flight-fixtures.ts.
// Run this once (on Replit, where FR24_API_KEY and internet access exist --
// this sandbox has neither), then commit the generated file. The live demo
// seed script (lib/demo/live-demo-seed.ts) picks from these real flights for
// its seeded historical flights instead of synthetic dates/routes/tracks.
// Debrief transcript/content stays fabricated (analyzeMock) -- there's no
// real audio for these flights, only real telemetry.
//
// Usage: node scripts/fetch-real-tracks.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const FR24_BASE_URL = "https://fr24api.flightradar24.com";

// Real, currently-active GA training aircraft (CAE Oxford Aviation Academy,
// Mesa/Falcon Field area) -- their real route/date/track become the demo's
// seeded historical flights. Debrief narrative content is still fabricated
// (no real audio exists for these flights).
const TAIL_NUMBERS = ["N28949", "N28959", "N28017", "N28098", "N28088", "N28051", "N50LU", "N28110"];
const FLIGHTS_PER_TAIL = 3;

const apiKey = process.env.FR24_API_KEY;
if (!apiKey) {
  console.error("[fetch-real-tracks] FR24_API_KEY is not set.");
  process.exit(1);
}

async function fr24Request(path, params) {
  const url = new URL(path, FR24_BASE_URL);
  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json", "Accept-Version": "v1" },
  });
  if (!res.ok) {
    throw new Error(`FR24 request failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

function toFr24Datetime(d) {
  return d.toISOString().replace(/\.\d{3}Z$/, "");
}

async function fetchFlightsForTail(tailNumber) {
  const now = new Date();
  const from = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const summary = await fr24Request("/api/flight-summary/full", {
    registrations: tailNumber.toUpperCase(),
    flight_datetime_from: toFr24Datetime(from),
    flight_datetime_to: toFr24Datetime(now),
    limit: "10",
  });
  const candidates = (summary.data ?? []).filter((c) => c.datetime_takeoff && c.datetime_landed);
  const chosen = candidates.slice(0, FLIGHTS_PER_TAIL);

  const flights = [];
  for (const c of chosen) {
    try {
      const trackData = await fr24Request("/api/flight-tracks", { flight_id: c.fr24_id });
      const points = trackData[0]?.tracks ?? [];
      if (points.length < 5) {
        console.warn(`[fetch-real-tracks] too few track points for ${tailNumber}/${c.fr24_id}, skipping.`);
        continue;
      }
      const durationMinutes = Math.round(
        (new Date(c.datetime_landed).getTime() - new Date(c.datetime_takeoff).getTime()) / 60000,
      );
      flights.push({
        tailNumber: (c.reg ?? tailNumber).toUpperCase(),
        aircraftType: c.type ?? null,
        departureAirport: c.orig_icao ?? "",
        arrivalAirport: c.dest_icao ?? "",
        takeoffIso: c.datetime_takeoff,
        durationMinutes,
        track: points.map((p) => ({ lat: p.lat, lon: p.lon, altitudeFt: p.alt, groundSpeedKt: p.gspeed })),
      });
    } catch (err) {
      console.warn(`[fetch-real-tracks] failed fetching track for ${tailNumber}/${c.fr24_id}:`, err.message);
    }
  }
  return flights;
}

const allFlights = [];
for (const tail of TAIL_NUMBERS) {
  try {
    const flights = await fetchFlightsForTail(tail);
    allFlights.push(...flights);
    console.log(`[fetch-real-tracks] got ${flights.length} flight(s) for ${tail}.`);
  } catch (err) {
    console.warn(`[fetch-real-tracks] failed for ${tail}:`, err.message);
  }
}

if (allFlights.length === 0) {
  console.error("[fetch-real-tracks] no flights fetched -- nothing written.");
  process.exit(1);
}

const outPath = join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "demo", "real-flight-fixtures.ts");
const fileContent = `import type { TrackPosition } from "@/lib/types";

export interface RealDemoFlight {
  tailNumber: string;
  aircraftType: string | null;
  departureAirport: string;
  arrivalAirport: string;
  /** ISO takeoff time from the real flight -- lib/demo/live-demo-seed.ts re-dates this to whatever historical slot it needs, keeping only relative timing/duration. */
  takeoffIso: string;
  durationMinutes: number;
  track: Omit<TrackPosition, "timestamp">[];
}

/**
 * Real recent flights (route, date, duration, tail number, GPS track) fetched
 * once from FR24 for real GA training aircraft, via
 * scripts/fetch-real-tracks.mjs. Reused by lib/demo/live-demo-seed.ts for its
 * seeded historical flights -- only the debrief narrative content layered on
 * top is fabricated (analyzeMock), since no real audio exists for these
 * flights. Regenerate by re-running the fetch script if these ever go stale
 * (FR24 only serves the last 14 days).
 */
export const REAL_DEMO_FLIGHTS: RealDemoFlight[] = ${JSON.stringify(allFlights, null, 2)};
`;
writeFileSync(outPath, fileContent);
console.log(`[fetch-real-tracks] wrote ${allFlights.length} real flights to ${outPath}.`);
