/**
 * Pulls flights at an airport from the Flightradar24 API into airport_flights.
 *
 *   node scripts/ingest-fr24-airport.mjs KFFZ --days 365
 *   node scripts/ingest-fr24-airport.mjs KFFZ --days 7 --dry-run
 *
 * One API call per day of the window. A year at one airport is ~365 calls,
 * which is cheap -- the reason this is affordable is that we are NOT pulling
 * tracks. Runway use would need one /api/flight-tracks call per flight, which
 * is a different order of cost and is deliberately not attempted here.
 *
 * WHAT A ROW MEANS
 * FR24's flight-summary returns one record per FLIGHT, not per movement. A
 * 1.4-hour local lesson containing a dozen touch-and-goes is a single record.
 * Everything downstream says "flights" for that reason. Do not relabel these
 * as operations.
 *
 * LICENSING
 * This writes third-party data into our database and the airport report
 * publishes figures derived from it. FR24's data services carry a licensing
 * agreement covering exactly that. Ingesting for evaluation is one thing;
 * publishing derived statistics is the thing the agreement is for. Settle it
 * before any airport report goes public.
 */
import pg from "pg";
import { randomUUID } from "node:crypto";

const KEY = process.env.FR24_API_KEY;
const connectionString = process.env.DATABASE_URL;
if (!KEY) {
  console.error("[ingest] FR24_API_KEY is not set.");
  process.exit(1);
}
if (!connectionString) {
  console.error("[ingest] DATABASE_URL is not set.");
  process.exit(1);
}

const argv = process.argv.slice(2);
const IDENT = (argv.find((a) => !a.startsWith("--")) ?? "KFFZ").toUpperCase();
const daysFlag = argv.indexOf("--days");
const DAYS = daysFlag === -1 ? 30 : Number(argv[daysFlag + 1]);
const DRY_RUN = argv.includes("--dry-run");

const BASE = "https://fr24api.flightradar24.com";
const SOURCE = "fr24";
const PAGE_LIMIT = 500;

const client = new pg.Client({ connectionString });
await client.connect();

const { rows: airportRows } = await client.query(
  "SELECT ident, timezone FROM airports WHERE ident = $1",
  [IDENT],
);
if (!airportRows.length) {
  console.error(`[ingest] ${IDENT} is not in the airports table. Add it first, with a timezone.`);
  process.exit(1);
}
const timezone = airportRows[0].timezone;
if (!timezone) {
  // Without the zone every local hour would be wrong, and "busiest hour" is
  // the headline figure. Failing here beats publishing a chart shifted by
  // seven hours.
  console.error(`[ingest] ${IDENT} has no timezone set. Local hours cannot be computed without it.`);
  process.exit(1);
}

/** UTC instant -> the airport's local hour, weekday and month. */
const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: timezone,
  hour: "numeric",
  hour12: false,
  weekday: "short",
  month: "numeric",
});
const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function localParts(iso) {
  const parts = partsFormatter.formatToParts(new Date(iso));
  const get = (type) => parts.find((p) => p.type === type)?.value;
  // Intl renders midnight as "24" in some hourCycles; normalise it.
  const hour = Number(get("hour")) % 24;
  return {
    hour,
    dayOfWeek: WEEKDAYS[get("weekday")] ?? 0,
    month: Number(get("month")),
  };
}

const fmt = (d) => d.toISOString().replace(/\.\d{3}Z$/, "");

async function fetchDay(from, to) {
  const url = new URL("/api/flight-summary/light", BASE);
  url.searchParams.set("airports", `both:${IDENT}`);
  url.searchParams.set("flight_datetime_from", fmt(from));
  url.searchParams.set("flight_datetime_to", fmt(to));
  url.searchParams.set("limit", String(PAGE_LIMIT));
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${KEY}`, Accept: "application/json", "Accept-Version": "v1" },
  });
  if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json();
  return body?.data ?? [];
}

/**
 * A record becomes one row. Which end of the flight we key off matters: for a
 * departure the airport saw the takeoff, for an arrival it saw the landing.
 * Using takeoff for everything would file an evening arrival under its
 * morning departure time from somewhere else entirely.
 */
function toRow(f) {
  const orig = f.orig_icao ?? null;
  const dest = f.dest_icao_actual ?? f.dest_icao ?? null;
  const takeoff = f.datetime_takeoff ?? null;
  const landed = f.datetime_landed ?? null;

  let kind = null;
  let occurredAt = null;
  if (orig === IDENT && dest === IDENT) {
    kind = "local";
    occurredAt = takeoff;
  } else if (orig === IDENT) {
    kind = "departure";
    occurredAt = takeoff;
  } else if (dest === IDENT) {
    kind = "arrival";
    occurredAt = landed;
  }
  // A record that touches neither end is not about this airport. Skipped
  // rather than guessed.
  if (!kind || !occurredAt) return null;

  const durationMinutes =
    takeoff && landed ? Math.round((new Date(landed).getTime() - new Date(takeoff).getTime()) / 60000) : null;

  const { hour, dayOfWeek, month } = localParts(occurredAt);
  return {
    id: randomUUID(),
    providerFlightId: f.fr24_id ?? null,
    kind,
    occurredAt,
    hour,
    dayOfWeek,
    month,
    // Guard against clock artefacts rather than storing a negative or a
    // multi-day block time on what is supposed to be a lesson.
    durationMinutes: durationMinutes !== null && durationMinutes > 0 && durationMinutes < 1440 ? durationMinutes : null,
    aircraftType: f.type ?? null,
    registration: f.reg ?? null,
    operator: f.operating_as ?? null,
    destination: kind === "departure" ? dest : null,
  };
}

console.log(`[ingest] ${IDENT} (${timezone}), ${DAYS} day window${DRY_RUN ? " — DRY RUN, nothing written" : ""}`);

let fetched = 0;
let written = 0;
let skipped = 0;
const kinds = new Map();

for (let d = 1; d <= DAYS; d++) {
  const to = new Date(Date.now() - (d - 1) * 86400000);
  const from = new Date(to.getTime() - 86400000);

  let records;
  try {
    records = await fetchDay(from, to);
  } catch (err) {
    // One bad day shouldn't lose the other 364. Reported, not swallowed --
    // a window with silent holes in it is a window whose sample size lies.
    console.error(`  ${fmt(from).slice(0, 10)}  FAILED: ${err.message}`);
    continue;
  }
  fetched += records.length;
  if (records.length >= PAGE_LIMIT) {
    console.warn(`  ${fmt(from).slice(0, 10)}  hit the ${PAGE_LIMIT} limit — this day is truncated.`);
  }

  const rows = records.map(toRow).filter(Boolean);
  skipped += records.length - rows.length;
  for (const r of rows) kinds.set(r.kind, (kinds.get(r.kind) ?? 0) + 1);

  if (!DRY_RUN && rows.length) {
    const values = [];
    const params = [];
    for (const r of rows) {
      const n = params.length;
      values.push(
        `($${n + 1},$${n + 2},$${n + 3},$${n + 4},$${n + 5},$${n + 6},$${n + 7},$${n + 8},$${n + 9},$${n + 10},$${n + 11},$${n + 12},$${n + 13},$${n + 14})`,
      );
      params.push(
        r.id, IDENT, r.providerFlightId, r.kind, r.occurredAt, r.hour, r.dayOfWeek, r.month,
        r.durationMinutes, r.aircraftType, r.registration, r.operator, r.destination, SOURCE,
      );
    }
    // Re-running a window updates rather than duplicates, so the script is
    // safe to run on a schedule with overlapping windows.
    const res = await client.query(
      `INSERT INTO airport_flights
         (id, airport_ident, provider_flight_id, flight_kind, occurred_at, local_hour,
          local_day_of_week, local_month, duration_minutes, aircraft_type, registration,
          operator, destination_ident, source)
       VALUES ${values.join(",")}
       ON CONFLICT (airport_ident, provider_flight_id) WHERE provider_flight_id IS NOT NULL
       DO UPDATE SET
         flight_kind = EXCLUDED.flight_kind,
         occurred_at = EXCLUDED.occurred_at,
         local_hour = EXCLUDED.local_hour,
         local_day_of_week = EXCLUDED.local_day_of_week,
         local_month = EXCLUDED.local_month,
         duration_minutes = EXCLUDED.duration_minutes,
         destination_ident = EXCLUDED.destination_ident`,
      params,
    );
    written += res.rowCount ?? 0;
  }

  if (d % 30 === 0 || d === DAYS) {
    console.log(`  ${d}/${DAYS} days — ${fetched} records fetched, ${written} rows written`);
  }
}

console.log(`\n[ingest] ${fetched} records fetched, ${written} rows written, ${skipped} skipped (touched neither end).`);
console.log(`[ingest] by kind: ${[...kinds.entries()].map(([k, n]) => `${k} ${n}`).join(", ") || "none"}`);
if (!DRY_RUN) console.log(`[ingest] now run: node scripts/recompute-airport-insights.mjs ${IDENT}`);

await client.end();
