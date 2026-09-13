// Read-only diagnostic: why doesn't a given TrainingItem id reach a real
// Chair Fly session? Prints the item's own description/evidence, which
// skill it resolves to and why, and whether that skill has an authored
// Chair Fly scenario. Changes nothing.
//
// Usage:
//   npx tsx scripts/diagnose-chair-fly-item.mjs <trainingItemId>
import { getRepository } from "../lib/data/index.ts";
import { resolveTrainingItemSkill } from "../lib/student/train-units.ts";
import { skillLabel } from "../lib/topics.ts";
import { hasAuthoredScenario } from "../lib/prototype/chair-fly.ts";

const itemId = process.argv[2];
if (!itemId) {
  console.error("Usage: npx tsx scripts/diagnose-chair-fly-item.mjs <trainingItemId>");
  process.exit(1);
}

const repo = getRepository();

const allItems = await repo.listTrainingItems();
const item = allItems.find((t) => t.id === itemId);

if (!item) {
  console.log(`No training_item row found with id "${itemId}" (across ALL students, not just one).`);
  process.exit(0);
}

console.log("--- Raw TrainingItem row ---");
console.log({
  id: item.id,
  flightId: item.flightId,
  debriefId: item.debriefId,
  category: item.category,
  visibility: item.visibility,
  description: item.description,
  instructorQuote: item.instructorQuote,
  observedMechanism: item.observedMechanism,
});

const [signals, flightTasks] = await Promise.all([repo.listTrainingSignals(), repo.listFlightTasks(item.flightId)]);

const matchingSignals = signals.filter((s) => s.debriefId === item.debriefId && s.statement === item.description);
console.log("\n--- Matching TrainingSignals (debriefId + exact description match) ---");
console.log(matchingSignals.length ? matchingSignals : "(none -- falls back to keyword matching on item.description)");

const flightTaskCodes = new Set(flightTasks.map((t) => t.taskCode));
console.log("\n--- This flight's logged FlightTask codes ---");
console.log([...flightTaskCodes]);

const resolvedSkill = resolveTrainingItemSkill(item, signals, flightTaskCodes);
console.log("\n--- Resolution result ---");
console.log("resolved skill code:", resolvedSkill);
console.log("resolved skill label (skillLabel()):", resolvedSkill ? skillLabel(resolvedSkill) : null);
console.log(
  "hasAuthoredScenario(label)?",
  resolvedSkill ? hasAuthoredScenario(skillLabel(resolvedSkill)) : "n/a -- no skill resolved at all",
);

console.log(
  "\nIf hasAuthoredScenario is false, this item structurally cannot reach a real Chair Fly session no matter what -- only the 'Crosswind Landings'/CROSSWIND_LANDING skill has an authored drill.",
);
