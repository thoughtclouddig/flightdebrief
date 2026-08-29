/**
 * Recomputes airport_insights from airport_operations.
 *
 * This is the scheduled half of the airport-data pipeline: pages read
 * airport_insights and never aggregate at request time. Run it on a schedule
 * (the same Replit Scheduled Deployment mechanism as the content pipeline).
 *
 *   node scripts/recompute-airport-insights.mjs            # all airports
 *   node scripts/recompute-airport-insights.mjs KHAF KPAO  # specific ones
 *   node scripts/recompute-airport-insights.mjs --days 365 # window length
 *
 * Airports below the sample floor are skipped and reported. A skipped airport
 * keeps whatever insights it already had rather than being overwritten with a
 * thinner window -- and an airport that has never cleared the floor simply has
 * no row, which is what a page should key off to decide it doesn't exist yet.
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[airport-insights] DATABASE_URL is not set.");
  process.exit(1);
}

// The aggregation itself lives in lib/airport-insights.ts, which is where it
// is unit-tested. Rather than add a build step for a script, the two values
// this script needs from it are read out directly -- if the floor changes
// there, it changes here.
const src = readFileSync(new URL("../lib/airport-insights.ts", import.meta.url), "utf8");
const MIN_SAMPLE_SIZE = Number(src.match(/MIN_SAMPLE_SIZE = (\d+)/)?.[1] ?? 500);

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

let written = 0;
const skipped = [];

for (const { ident } of airports) {
  const { rows: ops } = await client.query(
    `SELECT operation_type, local_hour, local_day_of_week, runway
       FROM airport_operations
      WHERE airport_ident = $1
        AND occurred_at >= now() - ($2 || ' days')::interval`,
    [ident, WINDOW_DAYS],
  );

  if (ops.length < MIN_SAMPLE_SIZE) {
    skipped.push(`${ident} (${ops.length})`);
    continue;
  }

  const total = ops.length;
  const tally = (key) => {
    const m = new Map();
    for (const o of ops) {
      const v = o[key];
      if (v === null || v === undefined) continue;
      m.set(v, (m.get(v) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([value, operations]) => ({ value, operations, share: operations / total }))
      .sort((a, b) => b.operations - a.operations || String(a.value).localeCompare(String(b.value)));
  };

  const hours = tally("local_hour").map((r) => ({ hour: r.value, operations: r.operations, share: r.share }));
  const days = tally("local_day_of_week").map((r) => ({ dayOfWeek: r.value, operations: r.operations, share: r.share }));
  const runways = tally("runway").map((r) => ({ runway: r.value, operations: r.operations, share: r.share }));

  await client.query(
    `INSERT INTO airport_insights
       (airport_ident, window_start, window_end, sample_size, busiest_hours, busiest_days, runway_use, common_destinations, computed_at)
     VALUES ($1, (now() - ($2 || ' days')::interval)::date, now()::date, $3, $4, $5, $6, '[]'::jsonb, now())
     ON CONFLICT (airport_ident) DO UPDATE SET
       window_start = EXCLUDED.window_start,
       window_end = EXCLUDED.window_end,
       sample_size = EXCLUDED.sample_size,
       busiest_hours = EXCLUDED.busiest_hours,
       busiest_days = EXCLUDED.busiest_days,
       runway_use = EXCLUDED.runway_use,
       computed_at = EXCLUDED.computed_at`,
    [ident, WINDOW_DAYS, total, JSON.stringify(hours), JSON.stringify(days), JSON.stringify(runways)],
  );
  written++;
  console.log(`[airport-insights] ${ident}: ${total} operations`);
}

console.log(`\n[airport-insights] wrote ${written} of ${airports.length} airports (${WINDOW_DAYS}-day window).`);
if (skipped.length) {
  console.log(`[airport-insights] below the ${MIN_SAMPLE_SIZE}-operation floor, left alone: ${skipped.join(", ")}`);
}

await client.end();
