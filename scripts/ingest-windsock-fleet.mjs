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

const nearby = await get(`/api/v3/airports/${IDENT}/nearby-aircraft`, { limit: 200 });
const aircraft = rowsOf(nearby);

if (!aircraft.length) {
  console.error("[windsock] No aircraft returned. Check the ident and the plan's access to this endpoint.");
  process.exit(1);
}

if (DRY_RUN) {
  // The response shape is not documented field-by-field, so the first run
  // prints it rather than assuming. Guessing at a contract is what cost real
  // money on the other API today.
  console.log(`\n[windsock] ${aircraft.length} rows. First record:`);
  console.log(JSON.stringify(aircraft[0], null, 2).slice(0, 2500));
  console.log(`\n[windsock] Fields present: ${Object.keys(aircraft[0]).join(", ")}`);
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
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
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
// The utilisation split that makes this worth publishing: a school aeroplane
// and a privately owned one of the same type live completely different lives.
const hardWorked = trainerHours.filter((h) => h >= 500).length;

const summary = {
  aircraftCount: aircraft.length,
  medianYear: median(years),
  topTypes,
  trainerCount: trainers.length,
  medianTrainerHours: median(trainerHours),
  hardWorkedTrainers: hardWorked,
};

console.log(`  ${summary.aircraftCount} aircraft, median year ${summary.medianYear ?? "unknown"}`);
console.log(`  ${summary.trainerCount} trainer-type aircraft, median ${summary.medianTrainerHours ?? "?"} hours last year`);
console.log(`  ${hardWorked} of them flew 500+ hours — school aircraft rather than privately owned`);
console.log(`  top types: ${topTypes.slice(0, 4).map((t) => `${t.type} (${t.count})`).join(", ")}`);

const client = new pg.Client({ connectionString });
await client.connect();
await client.query(
  `INSERT INTO airport_fleet
     (airport_ident, aircraft_count, median_year, top_types, trainer_count,
      median_trainer_hours, hard_worked_trainers, source, computed_at)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())
   ON CONFLICT (airport_ident) DO UPDATE SET
     aircraft_count = EXCLUDED.aircraft_count,
     median_year = EXCLUDED.median_year,
     top_types = EXCLUDED.top_types,
     trainer_count = EXCLUDED.trainer_count,
     median_trainer_hours = EXCLUDED.median_trainer_hours,
     hard_worked_trainers = EXCLUDED.hard_worked_trainers,
     source = EXCLUDED.source,
     computed_at = now()`,
  [
    IDENT,
    summary.aircraftCount,
    summary.medianYear,
    JSON.stringify(topTypes),
    summary.trainerCount,
    summary.medianTrainerHours,
    summary.hardWorkedTrainers,
    SOURCE,
  ],
);
console.log(`\n[windsock] stored. The report reads this directly — no recompute needed.`);
await client.end();
