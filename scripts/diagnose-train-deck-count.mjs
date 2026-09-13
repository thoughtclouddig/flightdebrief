// Read-only diagnostic: why does a given student's Train hub show only one
// card? Prints every keep_working_on TrainingItem tied to their most recent
// completed flight, which skill (if any) each one resolves to, and how many
// distinct units survive the by-skill dedup that feeds the deck. Changes
// nothing.
//
// Usage:
//   npx tsx scripts/diagnose-train-deck-count.mjs <studentUserId-or-email>
import { getRepository } from "../lib/data/index.ts";
import { computeNextLessonBrief } from "../lib/training-memory.ts";
import { resolveTrainingItemSkill } from "../lib/student/train-units.ts";
import { skillLabel } from "../lib/topics.ts";

const idOrEmail = process.argv[2];
if (!idOrEmail) {
  console.error("Usage: npx tsx scripts/diagnose-train-deck-count.mjs <studentUserId-or-email>");
  process.exit(1);
}

const repo = getRepository();

const looksLikeEmail = idOrEmail.includes("@");
const directUser = looksLikeEmail ? await repo.getUserByEmail(idOrEmail) : await repo.getUser(idOrEmail);
const studentId = directUser ? directUser.id : idOrEmail;
if (!directUser) {
  console.log(`No user found for "${idOrEmail}" -- treating the argument as the raw studentId as-is.`);
} else {
  console.log(`Resolved "${idOrEmail}" -> user ${directUser.id} (${directUser.name})`);
}

const brief = await computeNextLessonBrief(repo, studentId);
console.log("--- lastFlight ---");
console.log(brief.lastFlight ? { id: brief.lastFlight.id, flightDate: brief.lastFlight.flightDate, instructor: brief.lastFlight.instructor } : null);

console.log("\n--- keepWorkingOnTrainingItems (already filtered to lastFlight.id + category=keep_working_on + visible) ---");
console.log(brief.keepWorkingOnTrainingItems.map((t) => ({ id: t.id, description: t.description, debriefId: t.debriefId, visibility: t.visibility })));

if (!brief.lastFlight) process.exit(0);

const [signals, flightTasks] = await Promise.all([
  repo.listTrainingSignals({ studentId }),
  repo.listFlightTasks(brief.lastFlight.id),
]);
const flightTaskCodes = new Set(flightTasks.map((t) => t.taskCode));

console.log("\n--- Per-item skill resolution ---");
const bySkill = new Map();
for (const item of brief.keepWorkingOnTrainingItems) {
  const skill = resolveTrainingItemSkill(item, signals, flightTaskCodes);
  console.log({
    itemId: item.id,
    description: item.description,
    resolvedSkill: skill,
    resolvedSkillLabel: skill ? skillLabel(skill) : null,
    firstForThisSkill: skill ? !bySkill.has(skill) : "n/a (no skill -- item is silently dropped from Train)",
  });
  if (skill && !bySkill.has(skill)) bySkill.set(skill, item);
}

console.log(`\n--- Result: ${bySkill.size} distinct unit(s) will actually reach the Train deck ---`);
console.log([...bySkill.keys()].map((s) => skillLabel(s)));
