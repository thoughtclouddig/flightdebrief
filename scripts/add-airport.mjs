/**
 * Adds or updates an airport so it can be ingested and reported on.
 *
 * Exists so adding a field doesn't depend on psql being installed, and so the
 * timezone is a required argument rather than something easy to forget. The
 * ingester refuses to run without one: every local hour would otherwise be
 * silently wrong, and "busiest hour" is the headline figure on the page.
 *
 *   node scripts/add-airport.mjs KFFZ "Falcon Field Airport" America/Phoenix \
 *     --city Mesa --region AZ --lat 33.4608 --lon -111.7283
 */
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[airport] DATABASE_URL is not set.");
  process.exit(1);
}

const argv = process.argv.slice(2);
const positional = [];
const flags = {};
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith("--")) flags[argv[i].slice(2)] = argv[++i];
  else positional.push(argv[i]);
}

const [identRaw, name, timezone] = positional;
if (!identRaw || !name || !timezone) {
  console.error('Usage: node scripts/add-airport.mjs <IDENT> "<Name>" <IANA/Timezone> [--city X --region Y --lat N --lon N]');
  process.exit(1);
}
const ident = identRaw.toUpperCase();

// Validate the zone here rather than letting the ingester produce plausible
// but wrong local hours from a typo like "America/Pheonix".
try {
  new Intl.DateTimeFormat("en-US", { timeZone: timezone });
} catch {
  console.error(`[airport] "${timezone}" is not a valid IANA timezone.`);
  process.exit(1);
}

const client = new pg.Client({ connectionString });
await client.connect();
await client.query(
  `INSERT INTO airports (ident, name, municipality, region, latitude, longitude, timezone, is_training_field)
   VALUES ($1,$2,$3,$4,$5,$6,$7,true)
   ON CONFLICT (ident) DO UPDATE SET
     name = EXCLUDED.name,
     municipality = COALESCE(EXCLUDED.municipality, airports.municipality),
     region = COALESCE(EXCLUDED.region, airports.region),
     latitude = COALESCE(EXCLUDED.latitude, airports.latitude),
     longitude = COALESCE(EXCLUDED.longitude, airports.longitude),
     timezone = EXCLUDED.timezone,
     is_training_field = true`,
  [
    ident,
    name,
    flags.city ?? null,
    flags.region ?? null,
    flags.lat ? Number(flags.lat) : null,
    flags.lon ? Number(flags.lon) : null,
    timezone,
  ],
);

const now = new Intl.DateTimeFormat("en-US", {
  timeZone: timezone,
  hour: "numeric",
  minute: "2-digit",
}).format(new Date());
console.log(`[airport] ${ident} — ${name} (${timezone}, local time now ${now})`);
console.log(`[airport] next: node scripts/ingest-fr24-airport.mjs ${ident} --days 7 --dry-run`);

await client.end();
