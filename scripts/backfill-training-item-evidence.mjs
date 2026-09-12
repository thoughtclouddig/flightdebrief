// One-off DEV backfill: computes and persists evidence interpretation
// (lib/ai/evidence-mechanism.ts) for every seeded keep_working_on
// training_item that predates the instructor_quote/observed_mechanism
// columns -- normal product flow computes this once at creation time
// (app/api/debrief/analyze/route.ts); this script exists only to catch up
// rows that were already seeded before those columns existed.
//
// Safe by construction, not by convention: scoped to buildSeed()'s own
// flight ids -- small, fixed, human-readable strings ("flight-2",
// "flight-marcus-1", ...). A real flight created through the app's own Add
// Flight flow always gets a randomUUID() id, structurally incapable of
// colliding with a seed flight id -- see
// scripts/reset-seeded-training-items.mjs's own doc comment for the same
// guarantee. This can never touch a real student's real training item.
//
// Idempotent: only ever touches a row whose instructor_quote AND
// observed_mechanism are both still null, so re-running after a fresh
// FORCE_RESEED only backfills genuinely new items, never re-spends a model
// call on ones already interpreted.
//
// Usage:
//   npx tsx scripts/backfill-training-item-evidence.mjs
import { getRepository } from "../lib/data/index.ts";
import { buildSeed } from "../lib/data/seed.ts";
import { resolveTrainingItemSkill, resolveTrainingUnitEvidence } from "../lib/student/train-units.ts";
import { skillLabel } from "../lib/topics.ts";
import { resolveCfiFirstName } from "../lib/instructor-attribution.ts";

const repo = getRepository();
const seed = buildSeed();
const seedFlightIds = new Set(seed.flights.map((f) => f.id));

const allItems = await repo.listTrainingItems();
const targets = allItems.filter(
  (item) =>
    seedFlightIds.has(item.flightId) &&
    item.category === "keep_working_on" &&
    !item.instructorQuote &&
    !item.observedMechanism,
);

if (targets.length === 0) {
  console.log("[backfill-training-item-evidence] Nothing to backfill.");
  process.exit(0);
}
console.log(`[backfill-training-item-evidence] ${targets.length} seeded training_item row(s) need evidence interpretation.`);

const byFlight = new Map();
for (const item of targets) {
  if (!byFlight.has(item.flightId)) byFlight.set(item.flightId, []);
  byFlight.get(item.flightId).push(item);
}

const [flights, allSignals] = await Promise.all([repo.listFlights(), repo.listTrainingSignals()]);

let backfilled = 0;
for (const [flightId, items] of byFlight) {
  const flight = flights.find((f) => f.id === flightId);
  const [debrief, flightTasks] = await Promise.all([repo.getDebriefByFlight(flightId), repo.listFlightTasks(flightId)]);
  const cfiName = resolveCfiFirstName(flight?.instructor ?? null) ?? "your instructor";
  const flightTaskCodes = new Set(flightTasks.map((t) => t.taskCode));
  const assessmentDifferences = debrief?.structuredResult.assessmentDifferences ?? [];
  const instructorGuidance = debrief?.structuredResult.instructorGuidance ?? [];

  for (const item of items) {
    const skill = resolveTrainingItemSkill(item, allSignals, flightTaskCodes);
    if (!skill) continue;
    const { instructorQuote, mechanism } = await resolveTrainingUnitEvidence(
      assessmentDifferences,
      instructorGuidance,
      skill,
      skillLabel(skill),
      cfiName,
    );
    await repo.updateTrainingItemEvidence(item.id, { instructorQuote, observedMechanism: mechanism });
    backfilled++;
    console.log(`[backfill-training-item-evidence] ${item.id} (${skillLabel(skill)}) -> mechanism=${mechanism?.category ?? "null"}`);
  }
}

console.log(`[backfill-training-item-evidence] Done -- ${backfilled} of ${targets.length} row(s) backfilled (the rest resolved to no catalog skill at all).`);
process.exit(0);
