/**
 * Recomputes airport_insights from airport_flights.
 *
 * This is the scheduled half of the airport-data pipeline: pages read
 * airport_insights and never aggregate at request time.
 *
 *   node scripts/recompute-airport-insights.mjs            # all airports
 *   node scripts/recompute-airport-insights.mjs KFFZ       # specific ones
 *   node scripts/recompute-airport-insights.mjs --days 365 # window length
 *
 * Airports below the sample floor are skipped and reported. A skipped airport
 * keeps whatever insights it already had rather than being overwritten with a
 * thinner window -- and an airport that has never cleared the floor simply has
 * no row, which is what a page keys off to decide it doesn't exist yet.
 *
 * The unit is a flight, not a movement. See lib/airport-insights.ts.
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[airport-insights] DATABASE_URL is not set.");
  process.exit(1);
}

// The aggregation itself lives in lib/airport-insights.ts, which is where it
// is unit-tested. Rather than add a build step for a script, the floor is read
// out directly -- if it changes there, it changes here.
const src = readFileSync(new URL("../lib/airport-insights.ts", import.meta.url), "utf8");
const MIN_FLIGHT_COUNT = Number(src.match(/MIN_FLIGHT_COUNT = (\d+)/)?.[1] ?? 250);

const argv = process.argv.slice(2);
const daysFlag = argv.indexOf("--days");
const WINDOW_DAYS = daysFlag === -1 ? 365 : Number(argv[daysFlag + 1]);
const idents = argv.filter((a, i) => !a.startsWith("--") && i !== daysFlag + 1).map((a) => a.toUpperCase());

const client = new pg.Client({ connectionString });
await client.connect();

const { rows: airports } = await client.query(
  idents.length
    ? `SELECT ident FROM airports WHERE ident = ANY($1) ORDER BY ident`
    : `SELECT ident FROM airports ORDER BY ident`,
  idents.length ? [idents] : [],
);

const SEASONS = [
  ["winter", [12, 1, 2]],
  ["spring", [3, 4, 5]],
  ["summer", [6, 7, 8]],
  ["fall", [9, 10, 11]],
];

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

let written = 0;
const skipped = [];

for (const { ident } of airports) {
  const { rows: flights } = await client.query(
    `SELECT flight_kind, local_hour, local_day_of_week, local_month,
            duration_minutes, operator, destination_ident, source
       FROM airport_flights
      WHERE airport_ident = $1
        AND occurred_at >= now() - ($2 || ' days')::interval`,
    [ident, WINDOW_DAYS],
  );

  if (flights.length < MIN_FLIGHT_COUNT) {
    skipped.push(`${ident} (${flights.length})`);
    continue;
  }

  const total = flights.length;
  const tally = (key) => {
    const m = new Map();
    for (const f of flights) {
      const v = f[key];
      if (v === null || v === undefined) continue;
      m.set(v, (m.get(v) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([value, flights]) => ({ value, flights, share: flights / total }))
      .sort((a, b) => b.flights - a.flights || String(a.value).localeCompare(String(b.value)));
  };

  const hours = tally("local_hour").map((r) => ({ hour: r.value, flights: r.flights, share: r.share }));
  const days = tally("local_day_of_week").map((r) => ({ dayOfWeek: r.value, flights: r.flights, share: r.share }));
  const months = tally("local_month")
    .map((r) => ({ month: r.value, flights: r.flights, share: r.share }))
    .sort((a, b) => a.month - b.month);
  const operators = tally("operator")
    .map((r) => ({ operator: r.value, flights: r.flights, share: r.share }))
    .slice(0, 8);

  const seasons = SEASONS.map(([season, mons]) => {
    const rows = flights.filter((f) => mons.includes(f.local_month));
    const hourCounts = new Map();
    for (const f of rows) hourCounts.set(f.local_hour, (hourCounts.get(f.local_hour) ?? 0) + 1);
    const peak = [...hourCounts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
    return { season, flights: rows.length, share: rows.length / total, peakHour: peak ? peak[0] : null };
  });

  const dest = new Map();
  for (const f of flights) {
    if (f.flight_kind !== "departure" || !f.destination_ident) continue;
    dest.set(f.destination_ident, (dest.get(f.destination_ident) ?? 0) + 1);
  }
  const destinations = [...dest.entries()]
    .map(([airport, flights]) => ({ airport, flights }))
    .sort((a, b) => b.flights - a.flights || a.airport.localeCompare(b.airport))
    .slice(0, 10);

  const locals = flights.filter((f) => f.flight_kind === "local");
  const localShare = locals.length / total;
  const medianLocal = median(
    locals.map((f) => f.duration_minutes).filter((n) => typeof n === "number" && n > 0),
  );

  const sources = [...new Set(flights.map((f) => f.source))].sort();

  await client.query(
    `INSERT INTO airport_insights
       (airport_ident, window_start, window_end, flight_count, busiest_hours, busiest_days,
        by_month, by_season, common_destinations, top_operators, local_share,
        median_local_minutes, sources, computed_at)
     VALUES ($1, (now() - ($2 || ' days')::interval)::date, now()::date, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
     ON CONFLICT (airport_ident) DO UPDATE SET
       window_start = EXCLUDED.window_start,
       window_end = EXCLUDED.window_end,
       flight_count = EXCLUDED.flight_count,
       busiest_hours = EXCLUDED.busiest_hours,
       busiest_days = EXCLUDED.busiest_days,
       by_month = EXCLUDED.by_month,
       by_season = EXCLUDED.by_season,
       common_destinations = EXCLUDED.common_destinations,
       top_operators = EXCLUDED.top_operators,
       local_share = EXCLUDED.local_share,
       median_local_minutes = EXCLUDED.median_local_minutes,
       sources = EXCLUDED.sources,
       computed_at = EXCLUDED.computed_at`,
    [
      ident, WINDOW_DAYS, total,
      JSON.stringify(hours), JSON.stringify(days), JSON.stringify(months), JSON.stringify(seasons),
      JSON.stringify(destinations), JSON.stringify(operators), localShare, medianLocal, sources,
    ],
  );
  written++;
  console.log(
    `[airport-insights] ${ident}: ${total} flights, ${Math.round(localShare * 100)}% local` +
      `${medianLocal ? `, median local ${medianLocal} min` : ""}`,
  );
}

console.log(`\n[airport-insights] wrote ${written} of ${airports.length} airports (${WINDOW_DAYS}-day window).`);
if (skipped.length) {
  console.log(`[airport-insights] below the ${MIN_FLIGHT_COUNT}-flight floor, left alone: ${skipped.join(", ")}`);
}

await client.end();
