/**
 * Pulls flights at an airport from the Flightradar24 API into airport_flights.
 *
 *   node scripts/ingest-fr24-airport.mjs KFFZ --days 365
 *   node scripts/ingest-fr24-airport.mjs KFFZ --days 7 --dry-run
 *   node scripts/ingest-fr24-airport.mjs KFFZ --days 365 --chunk 14
 *   node scripts/ingest-fr24-airport.mjs KFFZ --days 30 --refresh
 *
 * The endpoint takes a date RANGE, so the window is pulled in chunks rather
 * than a call per day: a year at 14-day chunks is 26 calls, not 365. That
 * matters because the API rate-limits hard -- a 429 here comes back asking
 * for a 31-second wait, which at one call per day would be three hours.
 *
 * Chunk size is bounded by the response cap, not by politeness, and the cap
 * is enforced by the server rather than by our `limit` -- asking for 500
 * returns at most RESPONSE_CAP. A chunk that comes back at the cap has
 * silently lost the tail of its range, which is the most dangerous failure
 * available here: the data looks fine and the window quietly under-reports.
 *
 * So chunks are not trusted to be the right size. A range that returns the
 * cap is split in half and both halves are re-fetched, recursively -- and the
 * recursion goes below a day, because at a field like Falcon Field a single
 * day exceeds the cap on its own. It bottoms out at MIN_SPAN_MS, which is
 * short enough that no airport realistically fills it.
 *
 * Guessing a fixed --chunk does not work here at all: it would have to be
 * tuned per airport and per season, and getting it wrong loses data silently
 * rather than loudly.
 *
 * This is still cheap because we are NOT pulling tracks. Runway use would
 * need one /api/flight-tracks call per flight, which is a different order of
 * cost and is deliberately not attempted here.
 *
 * HOW FAR BACK
 * The plan bounds the history, not just the rate. A range starting before the
 * subscription's earliest date returns 400 with that date in the message, and
 * the script stops there rather than grinding through hundreds of doomed
 * chunks at 31 seconds each. The window you get is the window the plan sells;
 * a longer --days does not buy more history.
 *
 * RATE LIMITS AND RESUMING
 * The API rate-limits well below what a tight loop will do, so calls are
 * spaced by --delay and a 429 is retried with backoff rather than counted as
 * a lost day. Days already pulled are recorded in airport_ingest_days and
 * skipped on a re-run, so an interrupted year picks up where it stopped
 * instead of re-spending the calls that already worked. Pass --refresh to
 * re-pull days already recorded.
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
const delayFlag = argv.indexOf("--delay");
/** Milliseconds between calls. Tuned down from "as fast as possible", which the API rejects. */
const DELAY_MS = delayFlag === -1 ? 2500 : Number(argv[delayFlag + 1]);
const chunkFlag = argv.indexOf("--chunk");
/** Days per API call to start with. Ranges that overflow the response cap are split automatically. */
const CHUNK_DAYS = chunkFlag === -1 ? 2 : Number(argv[chunkFlag + 1]);
const DRY_RUN = argv.includes("--dry-run");
const REFRESH = argv.includes("--refresh");
const MAX_RETRIES = 5;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const BASE = "https://fr24api.flightradar24.com";
const SOURCE = "fr24";
/**
 * The most records the API will return for one range, regardless of `limit`.
 * Observed, not documented: every wide range comes back at exactly this many.
 * Treated as a truncation signal rather than a page size.
 */
const RESPONSE_CAP = 300;
const REQUEST_LIMIT = 500;
/**
 * The smallest range worth splitting to. One hour: no airport puts 300
 * flights into an hour, so reaching this bound means something else is wrong
 * -- a filter being ignored, say -- and that deserves a report rather than an
 * infinite descent.
 */
const MIN_SPAN_MS = 60 * 60 * 1000;

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

/**
 * One day, with backoff.
 *
 * A 429 is not a lost day -- it means we asked too fast, and the fix is to
 * wait rather than to drop the data and leave an invisible hole in the
 * window. Honours Retry-After when the server sends one, since that is a real
 * number and our doubling is a guess.
 */
async function fetchDay(from, to) {
  const url = new URL("/api/flight-summary/light", BASE);
  url.searchParams.set("airports", `both:${IDENT}`);
  url.searchParams.set("flight_datetime_from", fmt(from));
  url.searchParams.set("flight_datetime_to", fmt(to));
  url.searchParams.set("limit", String(REQUEST_LIMIT));

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${KEY}`, Accept: "application/json", "Accept-Version": "v1" },
    });
    if (res.ok) return (await res.json())?.data ?? [];

    const text = await res.text();

    // The plan's history limit. Not retryable, and not a per-chunk problem
    // either: every older chunk will fail the same way, so this aborts the
    // run rather than spending the rate limit discovering it 300 more times.
    if (res.status === 400 && /earlier than your subscription plan allows/i.test(text)) {
      const earliest = text.match(/from '([^']+)'/)?.[1] ?? "an unknown date";
      const err = new Error(`plan history starts at ${earliest}`);
      err.planLimit = earliest;
      throw err;
    }

    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= MAX_RETRIES) {
      throw new Error(`${res.status}: ${text.slice(0, 200)}`);
    }
    const retryAfter = Number(res.headers.get("retry-after"));
    const wait = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : Math.min(60_000, DELAY_MS * 2 ** (attempt + 1));
    console.log(`    ${res.status} — waiting ${Math.round(wait / 1000)}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
    await sleep(wait);
  }
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

// Days already pulled, so an interrupted run resumes instead of re-spending
// the calls that already worked.
const { rows: doneRows } = await client.query(
  "SELECT day FROM airport_ingest_days WHERE airport_ident = $1 AND source = $2",
  [IDENT, SOURCE],
);
const alreadyDone = new Set(
  doneRows.map((r) => (r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day))),
);

console.log(
  `[ingest] ${IDENT} (${timezone}), ${DAYS} day window in ${CHUNK_DAYS}-day chunks, ` +
    `${DELAY_MS}ms between calls${DRY_RUN ? " — DRY RUN, nothing written" : ""}`,
);
if (alreadyDone.size && !REFRESH) {
  console.log(`[ingest] ${alreadyDone.size} day(s) already pulled — skipping. Pass --refresh to re-pull.`);
}

let fetched = 0;
let written = 0;
let skipped = 0;
let resumed = 0;
let calls = 0;
const failedChunks = [];
const truncatedChunks = [];
const kinds = new Map();

/** The calendar days a chunk covers, oldest first, as YYYY-MM-DD. */
function daysIn(from, to) {
  const out = [];
  for (let t = from.getTime(); t < to.getTime(); t += 86400000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

const chunks = [];
for (let d = 1; d <= DAYS; d += CHUNK_DAYS) {
  const span = Math.min(CHUNK_DAYS, DAYS - d + 1);
  const to = new Date(Date.now() - (d - 1) * 86400000);
  const from = new Date(to.getTime() - span * 86400000);
  chunks.push({ from, to, days: daysIn(from, to) });
}

/**
 * Fetch one range, halving it whenever the response comes back at the cap.
 *
 * Returns the records, or null when a range at the minimum span still
 * overflows -- that range cannot be fully retrieved through this endpoint and
 * must not be recorded as pulled, because doing so would bake a permanent
 * hole into the window.
 */
async function fetchRange(from, to, depth = 0) {
  if (calls > 0) await sleep(DELAY_MS);
  const records = await fetchDay(from, to);
  calls++;

  if (records.length < RESPONSE_CAP) return records;

  const span = to.getTime() - from.getTime();
  if (span <= MIN_SPAN_MS) {
    console.warn(`  ${fmt(from)}..${fmt(to)} still at the ${RESPONSE_CAP}-record cap — cannot be fully covered.`);
    return null;
  }

  const mid = new Date(from.getTime() + Math.floor(span / 2));
  if (depth < 3) {
    // Deeper splits are routine at a busy field and would drown the log.
    console.log(`${"  ".repeat(depth + 1)}${fmt(from).slice(0, 13)}..${fmt(to).slice(0, 13)} hit the cap — splitting`);
  }
  const a = await fetchRange(from, mid, depth + 1);
  const b = await fetchRange(mid, to, depth + 1);
  if (a === null || b === null) return null;
  return [...a, ...b];
}

for (const [i, chunk] of chunks.entries()) {
  const label = `${chunk.days[0]}..${chunk.days[chunk.days.length - 1]}`;
  const missing = REFRESH ? chunk.days : chunk.days.filter((day) => !alreadyDone.has(day));
  if (!missing.length) {
    resumed += chunk.days.length;
    continue;
  }

  let records;
  try {
    records = await fetchRange(chunk.from, chunk.to);
  } catch (err) {
    if (err.planLimit) {
      // Everything older fails identically. Stop and say so plainly: this is
      // a subscription boundary, not a transient error, and no amount of
      // retrying or waiting changes it.
      console.log(`\n[ingest] Reached the end of the plan's history at ${err.planLimit}.`);
      console.log(`[ingest] Chunks older than that were not attempted.`);
      break;
    }
    // One bad chunk shouldn't lose the rest of the window. Collected and
    // reported at the end rather than swallowed -- a window with invisible
    // holes is a window whose published sample size under-reports.
    console.error(`  ${label}  FAILED: ${err.message}`);
    failedChunks.push(label);
    continue;
  }

  if (records === null) {
    truncatedChunks.push(label);
    continue;
  }
  fetched += records.length;

  const rows = records.map(toRow).filter(Boolean);
  skipped += records.length - rows.length;
  for (const r of rows) kinds.set(r.kind, (kinds.get(r.kind) ?? 0) + 1);

  if (!DRY_RUN) {
    if (rows.length) {
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
      // Re-running a window updates rather than duplicates, so overlapping
      // windows on a schedule are safe.
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

    // Every day in the chunk is marked, including days with no flights: a
    // genuinely quiet day is still a fetched day, and inferring completion
    // from the flights table would re-fetch it forever.
    const dayValues = chunk.days.map((_, i) => `($1, $${i + 3}, $2, 0, now())`).join(",");
    await client.query(
      `INSERT INTO airport_ingest_days (airport_ident, day, source, flights, fetched_at)
       VALUES ${dayValues}
       ON CONFLICT (airport_ident, day, source) DO UPDATE SET fetched_at = now()`,
      [IDENT, SOURCE, ...chunk.days],
    );
  }

  console.log(`  ${label}  ${records.length} records  (chunk ${i + 1}/${chunks.length})`);
}

console.log(`\n[ingest] ${fetched} records fetched, ${written} rows written, ${skipped} skipped (touched neither end).`);
if (resumed) console.log(`[ingest] ${resumed} day(s) skipped as already pulled.`);
console.log(`[ingest] by kind: ${[...kinds.entries()].map(([k, n]) => `${k} ${n}`).join(", ") || "none"}`);

console.log(`[ingest] ${calls} API call(s) used.`);

if (failedChunks.length || truncatedChunks.length) {
  // Stated loudly rather than buried: these are holes in the window, and the
  // sample size the page publishes would otherwise quietly under-report.
  if (failedChunks.length) {
    console.log(`\n[ingest] ${failedChunks.length} chunk(s) never succeeded and are NOT recorded as pulled.`);
    console.log(`[ingest] re-run the same command to retry only those, or raise --delay.`);
    console.log(`[ingest] ${failedChunks.slice(0, 5).join(", ")}`);
  }
  if (truncatedChunks.length) {
    console.log(`\n[ingest] ${truncatedChunks.length} chunk(s) could not be fully covered even split to single days.`);
    console.log(`[ingest] They are NOT recorded as pulled. This endpoint cannot return everything for:`);
    console.log(`[ingest] ${truncatedChunks.slice(0, 5).join(", ")}`);
  }
}

if (!DRY_RUN) console.log(`\n[ingest] now run: node scripts/recompute-airport-insights.mjs ${IDENT}`);

await client.end();
