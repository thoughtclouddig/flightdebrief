// One-off cleanup: deletes existing training_items rows that the
// narrative-recap/vague-restatement quality gate (lib/training-item-
// quality.ts) would now reject -- rows seeded before that gate was applied
// to seed data (see lib/data/seed.ts's toTrainingItems()), or persisted by
// a real debrief analyzed before the gate existed at all. Safe: only
// deletes rows failing isLowQualityTrainingItem, nothing else. Read-only
// dry run by default; pass --apply to actually delete.
//
// Usage:
//   npx tsx scripts/clean-low-quality-training-items.mjs           # dry run, lists what would be deleted
//   npx tsx scripts/clean-low-quality-training-items.mjs --apply   # actually deletes them
import { getDb } from "../lib/db.ts";
import { isLowQualityTrainingItem } from "../lib/training-item-quality.ts";

const apply = process.argv.includes("--apply");
const db = getDb();

const { rows } = await db.query("SELECT id, flight_id, category, description FROM training_items");
const toDelete = rows.filter((r) => isLowQualityTrainingItem(r.description));

if (toDelete.length === 0) {
  console.log("[clean-low-quality-training-items] Nothing to clean up.");
  process.exit(0);
}

console.log(`[clean-low-quality-training-items] ${toDelete.length} low-quality item(s) found:`);
for (const r of toDelete) {
  console.log(`  - [${r.category}] flight ${r.flight_id}: "${r.description}"`);
}

if (!apply) {
  console.log("\nDry run only -- re-run with --apply to delete these rows.");
  process.exit(0);
}

const ids = toDelete.map((r) => r.id);
await db.query("DELETE FROM training_items WHERE id = ANY($1::text[])", [ids]);
console.log(`[clean-low-quality-training-items] Deleted ${ids.length} row(s).`);
process.exit(0);
