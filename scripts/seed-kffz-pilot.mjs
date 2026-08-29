/**
 * Seeds SYNTHETIC operations for KFFZ (Falcon Field, Mesa AZ) so the airport
 * report can be built and reviewed end to end before any real feed exists.
 *
 * Everything written here carries source = 'synthetic'. That value propagates
 * into airport_insights.sources, and the report page reads it: a report built
 * on synthetic data renders a standing warning and is marked noindex. It is
 * not possible to publish this as a real finding by forgetting to check.
 *
 * The distributions below are shaped to be plausible for a Phoenix-area
 * training field -- morning-heavy to beat the heat, Saturday peak, mostly
 * pattern work -- so the LAYOUT can be judged. The NUMBERS are invented and
 * are not a claim about Falcon Field.
 *
 *   node scripts/seed-kffz-pilot.mjs
 *   node scripts/seed-kffz-pilot.mjs --clear   # remove the synthetic rows
 */
import pg from "pg";
import { randomUUID } from "node:crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[kffz] DATABASE_URL is not set.");
  process.exit(1);
}

const IDENT = "KFFZ";
const SOURCE = "synthetic";
const client = new pg.Client({ connectionString });
await client.connect();

if (process.argv.includes("--clear")) {
  const { rowCount } = await client.query(
    "DELETE FROM airport_operations WHERE airport_ident = $1 AND source = $2",
    [IDENT, SOURCE],
  );
  await client.query("DELETE FROM airport_insights WHERE airport_ident = $1", [IDENT]);
  console.log(`[kffz] removed ${rowCount} synthetic operations and the insights row.`);
  await client.end();
  process.exit(0);
}

await client.query(
  `INSERT INTO airports (ident, name, municipality, region, latitude, longitude, is_training_field)
   VALUES ($1, 'Falcon Field Airport', 'Mesa', 'AZ', 33.4608, -111.7283, true)
   ON CONFLICT (ident) DO UPDATE SET is_training_field = true`,
  [IDENT],
);

// Relative weight per local hour. Morning-heavy, a midday dip, an evening
// bump for night currency, effectively nothing overnight.
const HOUR_WEIGHTS = [
  0, 0, 0, 0, 0, 1, 6, 14, 20, 22, 19, 14, 9, 8, 9, 12, 15, 14, 9, 6, 4, 2, 1, 0,
];
// Sunday..Saturday. Weekends are the busy end at a training field.
const DAY_WEIGHTS = [16, 11, 12, 12, 13, 15, 21];
// Falcon Field's parallels. Weighted toward the 4s, which is the direction
// this field favours most of the year.
const RUNWAYS = [["4L", 34], ["4R", 30], ["22L", 18], ["22R", 18]];
const OP_TYPES = [["pattern", 62], ["arrival", 19], ["departure", 19]];
const DESTINATIONS = [
  ["KIWA", 22], ["KCHD", 18], ["KGEU", 14], ["KPRC", 11], ["KSDL", 10],
  ["KPAN", 8], ["KGYR", 7], ["KAVQ", 5], ["KTUS", 5],
];

function pick(weighted) {
  const total = weighted.reduce((n, [, w]) => n + w, 0);
  let r = Math.random() * total;
  for (const [value, w] of weighted) {
    r -= w;
    if (r <= 0) return value;
  }
  return weighted[weighted.length - 1][0];
}
const pickIndex = (weights) => pick(weights.map((w, i) => [i, w]));

const COUNT = 4200;
const values = [];
const params = [];
for (let i = 0; i < COUNT; i++) {
  const hour = pickIndex(HOUR_WEIGHTS);
  const dow = pickIndex(DAY_WEIGHTS);
  const type = pick(OP_TYPES);
  const daysAgo = Math.floor(Math.random() * 360);
  const n = params.length;
  values.push(`($${n + 1},$${n + 2},$${n + 3}, now() - ($${n + 4} || ' days')::interval, $${n + 5},$${n + 6},$${n + 7},$${n + 8},$${n + 9})`);
  params.push(
    randomUUID(),
    IDENT,
    type,
    daysAgo,
    hour,
    dow,
    pick(RUNWAYS),
    type === "departure" ? pick(DESTINATIONS) : null,
    SOURCE,
  );
}

await client.query(
  `INSERT INTO airport_operations
     (id, airport_ident, operation_type, occurred_at, local_hour, local_day_of_week, runway, destination_ident, source)
   VALUES ${values.join(",")}`,
  params,
);

console.log(`[kffz] inserted ${COUNT} synthetic operations.`);
console.log("[kffz] now run: node scripts/recompute-airport-insights.mjs KFFZ");
await client.end();
