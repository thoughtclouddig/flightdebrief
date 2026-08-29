/**
 * Pulls the aircraft registered near an airport from Windsock, for the
 * "what's flying here" section of an airport report.
 *
 *   node scripts/ingest-windsock-fleet.mjs KFFZ
 *   node scripts/ingest-windsock-fleet.mjs KFFZ --dry-run   # print the shape, write nothing
 *   node scripts/ingest-windsock-fleet.mjs KFFZ --probe     # find the request shape that works
 *
 * Windsock Enterprise API v3: https://windsock.ai/api/v3, authenticated with
 * an X-API-Key header. Set WINDSOCK_API_KEY.
 *
 * WHAT THIS IS NOT
 * "Registered near" is not "based at". The coordinate on a registry row is
 * the REGISTRANT'S MAILING ADDRESS, which for a flight school is its office
 * and for a management company is a lawyer's suite downtown. Within ten miles
 * of a field that is a good proxy and it is not a fact, so every figure this
 * writes is labelled registered-near and the page says so. Calling it "based
 * at" would be the same class of error as calling flights "operations".
 *
 * The interesting field is flight_hours_last_year. A 172 flying 1,100 hours
 * is a school aircraft on a line; a privately owned one flies 50 to 100. That
 * distinction is visible in this data and is genuinely useful to a student
 * choosing between schools, which is more than can be said for a fleet count
 * on its own.
 */
import pg from "pg";

const KEY = process.env.WINDSOCK_API_KEY;
const connectionString = process.env.DATABASE_URL;
if (!KEY) {
  console.error("[windsock] WINDSOCK_API_KEY is not set.");
  process.exit(1);
}
if (!connectionString) {
  console.error("[windsock] DATABASE_URL is not set.");
  process.exit(1);
}

const argv = process.argv.slice(2);
const IDENT = (argv.find((a) => !a.startsWith("--")) ?? "KFFZ").toUpperCase();
const DRY_RUN = argv.includes("--dry-run");
const PROBE = argv.includes("--probe");
const BASE = "https://windsock.ai";
const SOURCE = "windsock";

/** Types a training field actually operates, for the utilisation figure. */
const TRAINER_PATTERN = /^(172|152|PA-?28|PA28|DA40|DA20|SR20|SR22|177|182|AA-?5|C1[578]2)/i;

/** The airport's own coordinates, needed for the registry radius search. */
let LAT = null;
let LON = null;

async function get(path, params) {
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { "X-API-Key": KEY, Accept: "application/json" } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${path}: ${text.slice(0, 300)}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${path} returned non-JSON: ${text.slice(0, 200)}`);
  }
}

/** POST with the same key auth. The registry search is a POST with a filter body. */
async function post(path, body) {
  const res = await fetch(new URL(path, BASE), {
    method: "POST",
    headers: { "X-API-Key": KEY, Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${path}: ${text.slice(0, 300)}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${path} returned non-JSON: ${text.slice(0, 200)}`);
  }
}

/**
 * The list of aircraft, wherever the envelope puts it.
 *
 * v3 wraps everything in {data, meta}, but `data` is an object rather than an
 * array here -- it carries the rows under some key alongside its own
 * metadata. Rather than hard-code a guess at that key, take the longest array
 * one level down. If the shape changes, this keeps working; if there is no
 * array at all, it returns empty and the caller says so.
 */
function rowsOf(body) {
  if (Array.isArray(body)) return body;
  const data = body?.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const arrays = Object.values(data).filter(Array.isArray);
    return arrays.sort((a, b) => b.length - a.length)[0] ?? [];
  }
  return [];
}

console.log(`[windsock] ${IDENT}${DRY_RUN ? " — DRY RUN, nothing written" : ""}`);

// The airport record carries its coordinates, runways and frequencies. The
// coordinates are what the registry search needs; the runways are worth
// having in their own right, since deriving runway use from tracks gives a
// heading and this gives the identifier actually painted on it.
const airportBody = await get(`/api/v3/airports/${IDENT}`);
const airport = airportBody?.data ?? {};
LAT = airport.lat ?? null;
LON = airport.lon ?? null;
if (!PROBE) {
  console.log(`  ${airport.airport_name ?? IDENT} — ${airport.runways_count ?? "?"} runway(s), elevation ${airport.elevation_ft ?? "?"} ft`);
}

/**
 * Find the request the endpoint actually accepts.
 *
 * The first attempt sent `limit` and came back 422 "upstream airports service
 * error", which says the request was wrong without saying how. Rather than
 * guess a second time, try the plausible shapes and report which one works --
 * the same move that settled FR24's response cap.
 */
if (PROBE) {
  const variants = [
    ["airport detail", `/api/v3/airports/${IDENT}`, undefined],
    ["nearby-aircraft (airborne now, not the based fleet)", `/api/v3/airports/${IDENT}/nearby-aircraft`, { limit: 50 }],
  ];
  for (const [label, path, params] of variants) {
    try {
      const body = await get(path, params);
      const rows = rowsOf(body);
      console.log(`  OK    ${label} — ${rows.length} row(s)`);
      const data = body?.data;
      if (data && typeof data === "object" && !Array.isArray(data)) {
        const shape = Object.entries(data)
          .map(([k, v]) => `${k}${Array.isArray(v) ? `[${v.length}]` : `:${typeof v}`}`)
          .join(", ");
        console.log(`        data: ${shape}`);
      }
      if (rows.length) {
        console.log(`        row fields: ${Object.keys(rows[0]).slice(0, 24).join(", ")}`);
      }
    } catch (err) {
      console.log(`  FAIL  ${label} — ${err.message.slice(0, 140)}`);
    }
  }
  // The registry census lives on a POST endpoint with a filter grammar, so
  // it needs its own probe -- and the body shape is a guess until it answers.
  const searchBodies = [
    ["filters + limit", { filters: [{ field_name: "location_point", condition: "within_10", value: `${LAT},${LON}` }], limit: 5 }],
    ["filters only", { filters: [{ field_name: "location_point", condition: "within_10", value: `${LAT},${LON}` }] }],
  ];
  for (const [label, body] of searchBodies) {
    try {
      const res = await post("/api/v3/aircraft/search", body);
      const rows = rowsOf(res);
      console.log(`  OK    aircraft/search — ${label} — ${rows.length} row(s)`);
      if (rows.length) console.log(`        row fields: ${Object.keys(rows[0]).slice(0, 30).join(", ")}`);
      break;
    } catch (err) {
      console.log(`  FAIL  aircraft/search — ${label} — ${err.message.slice(0, 160)}`);
    }
  }

  console.log(`\n[windsock] Re-run with --dry-run once a variant works, and tell me which.`);
  process.exit(0);
}

/**
 * The census.
 *
 * NOT /nearby-aircraft, which returns what is airborne near the field right
 * now -- a live snapshot with altitudes and distances, and no utilisation
 * history. The registry search with a radius filter is what answers "what is
 * based around here", and it is the one that carries flight_hours_last_year.
 */
const RADIUS_MI = 10;
const PAGE = 200;
const MAX_ROWS = 800;

if (LAT === null || LON === null) {
  console.error(`[windsock] ${IDENT} has no coordinates in the airport record; cannot run a radius search.`);
  process.exit(1);
}

const filters = [
  { field_name: "location_point", condition: `within_${RADIUS_MI}`, value: `${LAT},${LON}` },
];

/**
 * The headline count comes from the histogram endpoint, in ONE request.
 *
 * Paging for it does not work and cannot be made to. Three runs minutes apart
 * gave 683, 683 and 681, with the type counts moving each time -- sorting on
 * tail number did not fix it, because the registry rows themselves are being
 * updated continuously and an offset walk over a moving set double-counts
 * some rows and misses others.
 *
 * A single aggregate request has no pages to drift between, so the number a
 * reader sees is reproducible. The composition below is still a sample and is
 * stored as one.
 */
const histogram = await post("/api/v3/aircraft/search/histogram", { filters });
const totalCount = histogram?.data?.total_count ?? null;

/**
 * A sample, for composition only.
 *
 * De-duplicated by id because the same row can appear on two pages. Its
 * COUNTS are not publishable -- they drift by a percent or two between runs --
 * but the ranking and the median build year are stable enough to describe the
 * fleet, and that is all the page claims from it.
 */
const seen = new Set();
const aircraft = [];
for (let offset = 0; offset < MAX_ROWS; offset += PAGE) {
  const body = await post("/api/v3/aircraft/search", {
    filters,
    limit: PAGE,
    offset,
    sort_field: "tail_number",
    sort_direction: "asc",
  });
  const rows = rowsOf(body);
  for (const row of rows) {
    const key = row.id ?? row.tail_number;
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    aircraft.push(row);
  }
  if (rows.length < PAGE) break;
}

if (!aircraft.length) {
  console.error("[windsock] The radius search returned nothing. Check the coordinates on the airport record.");
  process.exit(1);
}

if (DRY_RUN) {
  console.log(`\n[windsock] ${aircraft.length} rows. First record:`);
  console.log(JSON.stringify(aircraft[0], null, 2).slice(0, 2500));
  process.exit(0);
}

const year = (a) => Number(a.year) || null;
const model = (a) => String(a.model ?? "").trim();
const make = (a) => String(a.make ?? "").trim();
const hours = (a) => {
  const h = Number(a.flight_hours_last_year);
  return Number.isFinite(h) && h > 0 ? h : null;
};

const median = (values) => {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? Math.round(s[mid]) : Math.round((s[mid - 1] + s[mid]) / 2);
};

const byType = new Map();
for (const a of aircraft) {
  const label = [make(a), model(a)].filter(Boolean).join(" ") || "Unknown";
  byType.set(label, (byType.get(label) ?? 0) + 1);
}
const topTypes = [...byType.entries()]
  .map(([type, count]) => ({ type, count, share: count / aircraft.length }))
  .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type))
  .slice(0, 8);

const years = aircraft.map(year).filter(Boolean);
const trainers = aircraft.filter((a) => TRAINER_PATTERN.test(model(a)));
const trainerHours = trainers.map(hours).filter(Boolean);
// The split worth publishing: a school aeroplane and a privately owned one of
// the same type live completely different lives -- roughly 1,000 hours a year
// against 50. A fleet count alone says nothing; this says which fields have
// aircraft actually working.
const hardWorked = trainerHours.filter((h) => h >= 500).length;

// Runway identifiers as painted, from the airport record. Deriving runway use
// from ADS-B tracks gives a heading; this gives the name the reader expects.
const runways = Array.isArray(airport.runways)
  ? airport.runways.map((r) => r.ident ?? r.name ?? r.designator).filter(Boolean)
  : [];

console.log(`  ${totalCount ?? "?"} aircraft registered within ${RADIUS_MI} mi (histogram total, reproducible)`);
console.log(`  sample of ${aircraft.length} for composition — median build year ${median(years) ?? "unknown"}`);
console.log(`  top types: ${topTypes.slice(0, 4).map((t) => t.type).join(", ")}`);
// Kept in the log, not on the page. Eight aircraft over 500 hours out of ~170
// trainer types does not support a claim about how hard the fleet works: the
// school aircraft are registered to corporate addresses outside the radius,
// so a registry search finds local OWNERS rather than based aircraft.
console.log(`  (utilisation, not published: median ${median(trainerHours) ?? "?"} hrs, ${hardWorked} over 500)`);
if (runways.length) console.log(`  runways: ${runways.join(", ")}`);

const client = new pg.Client({ connectionString });
await client.connect();
await client.query(
  `INSERT INTO airport_fleet
     (airport_ident, aircraft_count, median_year, top_types, trainer_count,
      median_trainer_hours, hard_worked_trainers, radius_mi, runways, source, computed_at)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now())
   ON CONFLICT (airport_ident) DO UPDATE SET
     aircraft_count = EXCLUDED.aircraft_count,
     median_year = EXCLUDED.median_year,
     top_types = EXCLUDED.top_types,
     trainer_count = EXCLUDED.trainer_count,
     median_trainer_hours = EXCLUDED.median_trainer_hours,
     hard_worked_trainers = EXCLUDED.hard_worked_trainers,
     radius_mi = EXCLUDED.radius_mi,
     runways = EXCLUDED.runways,
     source = EXCLUDED.source,
     computed_at = now()`,
  [
    IDENT,
    totalCount ?? aircraft.length,
    median(years),
    JSON.stringify(topTypes),
    trainers.length,
    median(trainerHours),
    hardWorked,
    RADIUS_MI,
    runways,
    SOURCE,
  ],
);
console.log(`\n[windsock] stored. The report reads this directly — no recompute needed.`);
await client.end();
