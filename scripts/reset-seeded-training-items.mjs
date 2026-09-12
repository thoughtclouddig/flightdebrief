// One-off DEV cleanup: deletes every training_items row belonging to a
// SEEDED flight (never a real, app-created one -- see below), so the next
// reseed inserts a clean set under lib/data/seed.ts's new content-derived
// id scheme (stableTrainingItemId) instead of piling up alongside whatever
// is already there under the old, now-abandoned position-derived ids
// (`${debriefId}-keep-${n}`). Changing the id scheme alone does not clean
// up rows already inserted under the old scheme -- those ids don't match
// anything the fixed seed code will ever generate, so ON CONFLICT DO
// NOTHING can't reconcile them; the old rows (originals AND any accidental
// duplicates from a reseed that ran between the quality-filter fix and the
// id-scheme fix) just sit there forever unless explicitly removed.
//
// Safe by construction, not by convention: buildSeed()'s flight ids are
// small, fixed, human-readable strings ("flight-2", "flight-marcus-1", ...).
// A real flight created through the app's own Add Flight flow always gets
// a randomUUID() id (see app/api/flights/route.ts's repo.getOrCreateAircraft
// / flight creation path) -- structurally incapable of colliding with a
// seed flight id. This can never delete a real student's real training
// item, seeded or not.
//
// Usage:
//   npx tsx scripts/reset-seeded-training-items.mjs           # dry run
//   npx tsx scripts/reset-seeded-training-items.mjs --apply   # deletes
// After --apply, reseed with:
//   FORCE_RESEED=1 npx tsx scripts/force-lazy-seed.mjs
import { getDb } from "../lib/db.ts";
import { buildSeed } from "../lib/data/seed.ts";

const apply = process.argv.includes("--apply");
const db = getDb();
const seed = buildSeed();
const seedFlightIds = seed.flights.map((f) => f.id);

const { rows } = await db.query(
  "SELECT id, flight_id, category, description FROM training_items WHERE flight_id = ANY($1::text[])",
  [seedFlightIds],
);

if (rows.length === 0) {
  console.log("[reset-seeded-training-items] No seeded training_items found -- nothing to clean up.");
  process.exit(0);
}

const flightCount = new Set(rows.map((r) => r.flight_id)).size;
console.log(`[reset-seeded-training-items] ${rows.length} seeded training_item row(s) found across ${flightCount} flight(s).`);

if (!apply) {
  console.log(
    "\nDry run only. Re-run with --apply to delete these rows, then run:\n" +
      "  FORCE_RESEED=1 npx tsx scripts/force-lazy-seed.mjs\n" +
      "to reinsert a clean, deduplicated set with stable ids.",
  );
  process.exit(0);
}

await db.query("DELETE FROM training_items WHERE flight_id = ANY($1::text[])", [seedFlightIds]);
console.log(
  `[reset-seeded-training-items] Deleted ${rows.length} row(s). Now run:\n` +
    "  FORCE_RESEED=1 npx tsx scripts/force-lazy-seed.mjs\n" +
    "to reinsert a clean, deduplicated set with stable ids.",
);
process.exit(0);
