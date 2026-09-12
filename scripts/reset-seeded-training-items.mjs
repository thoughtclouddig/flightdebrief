// One-off DEV cleanup: deletes every training_items AND training_signals row
// belonging to a SEEDED flight (never a real, app-created one -- see below),
// so the next reseed inserts a clean set under lib/data/seed.ts's current
// content-derived id scheme (stableTrainingItemId) and re-classifies every
// signal with the current matchSkills()/TOPIC_LIBRARY rules, instead of
// piling up alongside whatever is already there.
//
// training_signals matters just as much as training_items: TrainingSignal
// rows are classified once, at seed time, by whatever keyword rules existed
// then. A later TOPIC_LIBRARY keyword fix (e.g. narrowing an overly broad
// keyword) only changes what NEW classification runs produce -- it does not
// retroactively correct rows already sitting in the table, and
// lib/student/train-units.ts's resolveTrainingItemSkill() deliberately
// trusts an existing signal for the exact same sentence over recomputing
// from scratch. Skipping this table here means the earlier keyword fix
// would silently keep serving the OLD, wrong classification forever.
//
// Safe by construction, not by convention: buildSeed()'s flight ids are
// small, fixed, human-readable strings ("flight-2", "flight-marcus-1", ...).
// A real flight created through the app's own Add Flight flow always gets
// a randomUUID() id (see app/api/flights/route.ts's repo.getOrCreateAircraft
// / flight creation path) -- structurally incapable of colliding with a
// seed flight id. This can never delete a real student's real training
// item or signal, seeded or not.
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

const [{ rows: items }, { rows: signals }] = await Promise.all([
  db.query("SELECT id FROM training_items WHERE flight_id = ANY($1::text[])", [seedFlightIds]),
  db.query("SELECT id FROM training_signals WHERE flight_id = ANY($1::text[])", [seedFlightIds]),
]);

if (items.length === 0 && signals.length === 0) {
  console.log("[reset-seeded-training-items] No seeded training_items or training_signals found -- nothing to clean up.");
  process.exit(0);
}

console.log(
  `[reset-seeded-training-items] ${items.length} seeded training_item row(s) and ${signals.length} seeded training_signal row(s) found.`,
);

if (!apply) {
  console.log(
    "\nDry run only. Re-run with --apply to delete these rows, then run:\n" +
      "  FORCE_RESEED=1 npx tsx scripts/force-lazy-seed.mjs\n" +
      "to reinsert a clean, deduplicated, correctly-classified set.",
  );
  process.exit(0);
}

await Promise.all([
  db.query("DELETE FROM training_items WHERE flight_id = ANY($1::text[])", [seedFlightIds]),
  db.query("DELETE FROM training_signals WHERE flight_id = ANY($1::text[])", [seedFlightIds]),
]);
console.log(
  `[reset-seeded-training-items] Deleted ${items.length} training_item row(s) and ${signals.length} training_signal row(s). Now run:\n` +
    "  FORCE_RESEED=1 npx tsx scripts/force-lazy-seed.mjs\n" +
    "to reinsert a clean, deduplicated, correctly-classified set.",
);
process.exit(0);
