/**
 * Asks the FR24 API what the current subscription can actually do, instead of
 * guessing from the pricing page.
 *
 * Deliberately small: one usage call and one short-window airport query with a
 * low limit. It spends a handful of credits, not a batch. Nothing is written
 * to the database -- this only reports.
 *
 *   node scripts/probe-fr24.mjs            # KFFZ, yesterday
 *   node scripts/probe-fr24.mjs KPAO       # another field
 *   node scripts/probe-fr24.mjs KFFZ 3     # 3 days back (one call per day)
 *
 * What it answers:
 *   - which endpoints the key is entitled to (403 vs 200)
 *   - whether GA training traffic shows up at all, or only airline flights
 *   - which fields come back, and therefore which report sections FR24 can
 *     feed directly and which need something else
 */
const KEY = process.env.FR24_API_KEY;
if (!KEY) {
  console.error("[fr24] FR24_API_KEY is not set.");
  process.exit(1);
}

const BASE = "https://fr24api.flightradar24.com";
const IDENT = (process.argv[2] ?? "KFFZ").toUpperCase();
const DAYS = Number(process.argv[3] ?? 1);

async function call(path, params) {
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${KEY}`, Accept: "application/json", "Accept-Version": "v1" },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { ok: res.ok, status: res.status, body };
}

const fmt = (d) => d.toISOString().replace(/\.\d{3}Z$/, "");

console.log(`\n=== 1. Account usage =============================================`);
const usage = await call("/api/usage", { period: "24h" });
if (usage.ok) {
  console.log(JSON.stringify(usage.body, null, 2).slice(0, 2000));
} else {
  console.log(`  ${usage.status} — ${JSON.stringify(usage.body).slice(0, 300)}`);
  console.log("  (a 403 here usually means the plan does not expose usage, not that the key is bad)");
}

console.log(`\n=== 2. Airport query: ${IDENT}, ${DAYS} day(s) ======================`);
console.log("  Endpoint: /api/flight-summary/light with an airports filter.");
console.log("  This is the call an ingestion pipeline would make in bulk.\n");

const seen = [];
let blocked = null;

for (let d = 1; d <= DAYS; d++) {
  const to = new Date(Date.now() - (d - 1) * 86400000);
  const from = new Date(to.getTime() - 86400000);
  const r = await call("/api/flight-summary/light", {
    airports: `both:${IDENT}`,
    flight_datetime_from: fmt(from),
    flight_datetime_to: fmt(to),
    limit: "100",
  });

  if (!r.ok) {
    blocked = r;
    console.log(`  ${fmt(from).slice(0, 10)}  ->  ${r.status}: ${JSON.stringify(r.body).slice(0, 400)}`);
    break;
  }
  const rows = r.body?.data ?? [];
  seen.push(...rows);
  console.log(`  ${fmt(from).slice(0, 10)}  ->  ${rows.length} flights returned (limit 100)`);
}

if (blocked) {
  console.log(`\n  The airport filter is not available on this key/plan.`);
  console.log(`  That is the answer: bulk airport pulls need the data-services agreement,`);
  console.log(`  not a bigger API tier. Nothing else here will work around it.`);
  process.exit(0);
}

console.log(`\n=== 3. What came back ============================================`);
if (!seen.length) {
  console.log("  Nothing. Either the window is empty or this field's traffic isn't in FR24's feed.");
  process.exit(0);
}

console.log(`  ${seen.length} records total.\n`);
console.log("  Fields present on the first record:");
console.log("  " + JSON.stringify(seen[0], null, 2).split("\n").join("\n  "));

// The question that actually matters: is this training traffic or airline traffic?
const types = new Map();
for (const f of seen) {
  const t = f.type ?? f.aircraft_type ?? "(none)";
  types.set(t, (types.get(t) ?? 0) + 1);
}
console.log(`\n  Aircraft types seen (training fields should be dominated by C172/PA28/SR20-class):`);
for (const [t, n] of [...types.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`    ${String(t).padEnd(10)} ${n}`);
}

const withRunway = seen.filter((f) => JSON.stringify(f).toLowerCase().includes("runway")).length;
console.log(`\n  Records carrying any runway field: ${withRunway} of ${seen.length}`);
console.log(`  Records with both takeoff and landing times: ${
  seen.filter((f) => f.datetime_takeoff && f.datetime_landed).length
} of ${seen.length}`);

console.log(`\n=== 4. What this can feed ========================================`);
console.log("  Hour-of-day and day-of-week   : yes, from the takeoff/landing timestamps.");
console.log("  Common destinations           : yes, from dest_icao on departures.");
console.log(`  Runway use                    : ${withRunway ? "yes, directly" : "NO -- not in this response."}`);
if (!withRunway) {
  console.log("    Runway would have to be derived from the last track positions, which is");
  console.log("    one /api/flight-tracks call per flight. At airport scale that is the");
  console.log("    expensive part, and the reason to price the data-services feed instead.");
}
console.log("  Pattern work                  : needs checking -- a touch-and-go may appear");
console.log("    as one flight, several, or none. Look at whether orig and dest are both");
console.log(`    ${IDENT} in the records above.`);
const local = seen.filter((f) => f.orig_icao === IDENT && f.dest_icao === IDENT).length;
console.log(`    Records with orig = dest = ${IDENT}: ${local} of ${seen.length}`);
