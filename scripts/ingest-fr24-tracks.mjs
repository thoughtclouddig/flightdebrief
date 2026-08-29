/**
 * Pulls a sample of ground tracks for local flights at an airport, for the
 * density map of where flying from that field actually happens.
 *
 *   node scripts/ingest-fr24-tracks.mjs KFFZ --sample 400
 *   node scripts/ingest-fr24-tracks.mjs KFFZ --sample 50 --dry-run
 *
 * A SAMPLE, not a census -- but a much cheaper one than it first appeared.
 *
 * Measured: a track costs 40 credits, about 1.1 cents. Four hundred is under
 * five dollars. The flight-summary endpoint that fills airport_flights bills
 * per RECORD at roughly 2.5 credits each, so a wide query costs ~760 credits
 * a call -- fifty times a track. Counting requests instead of credits gets
 * this exactly backwards, which is how the first version of this comment
 * described tracks as the expensive path.
 *
 * Still a sample rather than a census: 30,000 tracks would be around $350,
 * and a few hundred already show where the practice areas are. Raise --sample
 * freely though; the figure gets better with more and the cost is small.
 *
 * The sample is spread across hours and months rather than taken as "the most
 * recent N", because the most recent N is one week of one season and would
 * draw a map of that week.
 *
 * ONLY LOCAL FLIGHTS
 * Departures and arrivals leave the frame almost immediately and would add a
 * spray of lines to the edges without saying anything about this airport.
 * Local flights -- departed here, returned here -- are the ones whose whole
 * shape belongs to the field.
 *
 * WHAT IS STORED
 * Coordinates, month and hour. No registration, no callsign, no flight id, no
 * date. The published artefact is the composite; individual identifiable
 * tracks are a different and much worse thing to publish, and the surest way
 * not to publish them is not to keep them.
 */
import pg from "pg";
import { randomUUID } from "node:crypto";

const KEY = process.env.FR24_API_KEY;
const connectionString = process.env.DATABASE_URL;
if (!KEY) {
  console.error("[tracks] FR24_API_KEY is not set.");
  process.exit(1);
}
if (!connectionString) {
  console.error("[tracks] DATABASE_URL is not set.");
  process.exit(1);
}

const argv = process.argv.slice(2);
const IDENT = (argv.find((a) => !a.startsWith("--")) ?? "KFFZ").toUpperCase();
const sampleFlag = argv.indexOf("--sample");
const SAMPLE = sampleFlag === -1 ? 400 : Number(argv[sampleFlag + 1]);
const delayFlag = argv.indexOf("--delay");
const DELAY_MS = delayFlag === -1 ? 2500 : Number(argv[delayFlag + 1]);
const DRY_RUN = argv.includes("--dry-run");
const MAX_RETRIES = 5;
/** Enough to keep the shape of a pattern or a practice-area run; far fewer than the raw feed. */
const MAX_POINTS = 120;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = "https://fr24api.flightradar24.com";
const SOURCE = "fr24";

const client = new pg.Client({ connectionString });
await client.connect();

/**
 * Spread the sample across hour and month rather than taking the newest N.
 *
 * The newest N is one week of one season, and at a field where summer flying
 * happens at dawn that draws a map of dawn in summer. ntile buckets the local
 * flights by hour-and-month and takes evenly from each bucket.
 */
const { rows: candidates } = await client.query(
  `WITH local_flights AS (
     SELECT provider_flight_id, local_hour, local_month,
            row_number() OVER (PARTITION BY local_month, local_hour ORDER BY random()) AS rn
       FROM airport_flights
      WHERE airport_ident = $1
        AND flight_kind = 'local'
        AND provider_flight_id IS NOT NULL
        -- Additive: a second run extends the sample instead of paying again
        -- for flights already in it.
        AND track_fetched_at IS NULL
   )
   SELECT provider_flight_id, local_hour, local_month
     FROM local_flights
    ORDER BY rn, random()
    LIMIT $2`,
  [IDENT, SAMPLE],
);

if (!candidates.length) {
  console.error(
    `[tracks] No local flights left to sample for ${IDENT}. Either the flight ingester has not run,` +
      ` or every local flight already has its track.`,
  );
  process.exit(1);
}

const { rows: existing } = await client.query(
  "SELECT count(*)::int AS n FROM airport_tracks WHERE airport_ident = $1",
  [IDENT],
);
if (existing[0].n) {
  console.log(`[tracks] ${existing[0].n} track(s) already stored. This run adds to them.`);
}

console.log(`[tracks] ${IDENT}: ${candidates.length} local flights sampled${DRY_RUN ? " — DRY RUN" : ""}`);

async function fetchTrack(flightId) {
  const url = new URL("/api/flight-tracks", BASE);
  url.searchParams.set("flight_id", flightId);
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${KEY}`, Accept: "application/json", "Accept-Version": "v1" },
    });
    if (res.ok) {
      const body = await res.json();
      return body?.[0]?.tracks ?? [];
    }
    const text = await res.text();

    // Out of credits. An account state, not a transient error: every
    // remaining flight fails the same way, so this stops the run instead of
    // discovering it four hundred more times.
    if (res.status === 402) {
      const err = new Error("credit limit reached");
      err.outOfCredits = true;
      throw err;
    }

    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= MAX_RETRIES) throw new Error(`${res.status}: ${text.slice(0, 160)}`);
    const retryAfter = Number(res.headers.get("retry-after"));
    const wait = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : Math.min(60_000, DELAY_MS * 2 ** (attempt + 1));
    console.log(`    ${res.status} — waiting ${Math.round(wait / 1000)}s`);
    await sleep(wait);
  }
}

/**
 * Even thinning by index.
 *
 * Not Douglas-Peucker, which the app uses for a single track it wants to draw
 * faithfully. Here 400 tracks are overlaid at low opacity and only the
 * density matters, so keeping the point count uniform across tracks keeps any
 * one flight from weighting the composite more than another simply because it
 * had more position reports.
 */
function thin(points) {
  const usable = points.filter(
    (p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lon) && (p.lat !== 0 || p.lon !== 0),
  );
  if (usable.length <= MAX_POINTS) return usable.map((p) => [round(p.lon), round(p.lat)]);
  const step = usable.length / MAX_POINTS;
  const out = [];
  for (let i = 0; i < MAX_POINTS; i++) out.push(usable[Math.floor(i * step)]);
  return out.map((p) => [round(p.lon), round(p.lat)]);
}

/** ~11m precision. Plenty for a density map, and a third of the storage. */
const round = (n) => Math.round(n * 1e4) / 1e4;

let written = 0;
let empty = 0;
let failed = 0;

for (const [i, c] of candidates.entries()) {
  if (i > 0) await sleep(DELAY_MS);

  let tracks;
  try {
    tracks = await fetchTrack(c.provider_flight_id);
  } catch (err) {
    if (err.outOfCredits) {
      console.log(`\n[tracks] Out of API credits after ${written} tracks. Stopping.`);
      console.log(`[tracks] What is stored is still usable -- re-run later to add more.`);
      break;
    }
    console.error(`  ${c.provider_flight_id}  FAILED: ${err.message}`);
    failed++;
    continue;
  }

  if (!DRY_RUN) {
    // Marked whether or not the track turned out usable. A flight whose
    // positions came back too sparse is still a flight we have paid for, and
    // re-fetching it next run would buy the same nothing again.
    await client.query(
      "UPDATE airport_flights SET track_fetched_at = now() WHERE airport_ident = $1 AND provider_flight_id = $2",
      [IDENT, c.provider_flight_id],
    );
  }

  const points = thin(tracks);
  // Two points is a straight line between wherever ADS-B happened to see it.
  // That is noise in a composite, not a track.
  if (points.length < 5) {
    empty++;
    continue;
  }

  if (!DRY_RUN) {
    await client.query(
      `INSERT INTO airport_tracks (id, airport_ident, points, local_month, local_hour, source)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [randomUUID(), IDENT, JSON.stringify(points), c.local_month, c.local_hour, SOURCE],
    );
    written++;
  }

  if ((i + 1) % 25 === 0) {
    console.log(`  ${i + 1}/${candidates.length} — ${written} stored, ${empty} too sparse, ${failed} failed`);
  }
}

console.log(`\n[tracks] ${written} tracks stored, ${empty} too sparse to use, ${failed} failed.`);
if (!DRY_RUN) console.log(`[tracks] the map on /field-notes/airports/${IDENT.toLowerCase()} reads these directly.`);

await client.end();
