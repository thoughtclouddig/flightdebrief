// Read-only, no-database dry run: exercises the exact same pure functions
// buildSeed()/buildTrainingPlan()/resolveVectorStrategy() use, against Mia's
// three real seeded transcripts, to confirm the seed change actually
// produces the intended skill/strategy variety BEFORE trusting it against a
// live database. Changes nothing; imports straight from source.
//
// Usage: npx tsx scripts/verify-mia-seed-strategy.mjs
import { analyzeMock } from "../lib/ai/mock-analyzer.ts";
import { classifyTrainingSignals } from "../lib/taxonomy.ts";
import { skillLabel } from "../lib/topics.ts";
import { computeSkillProgression } from "../lib/skill-progress.ts";
import { resolveVectorStrategy } from "../lib/student/vector-coaching.ts";
import { resolveTrainingItemSkill } from "../lib/student/train-units.ts";

const MIA_FLIGHT_1_TRANSCRIPT =
  "Landings today with Dana. Landings were rough -- you were carrying too much speed into short final a couple of times. Dana had me get configured earlier next time instead of fixing speed right at the runway. Your short field approach looked good, nice and controlled. Crosswind correction needs work -- you were behind the airplane and let it drift once you got into the flare. I also got a little behind in the pattern once and let my pattern altitude drift more than I should have. Radio calls were clear and confident all flight.";
const MIA_FLIGHT_2_TRANSCRIPT =
  "Pattern work with Jake today. You were carrying too much speed into two of the landings again, still fixing it late instead of configuring earlier. Jake wanted me to get stabilized well before the turn to final next time. Crosswind landings were better today -- centerline control improved. You still need to work on holding the crosswind correction through the flare. I still need to work on tightening up my spacing in the pattern so I'm not crowding the airplane ahead of me. Short-field landings looked solid, nailed the aiming point on a couple of them. Radio calls stayed confident all flight.";
const MIA_FLIGHT_3_TRANSCRIPT =
  "Crosswind and short-field landings with Jake today. Centerline control was much better. On the crosswind landings you still need to work on holding the correction once you get into the flare. Your short field approach was solid again, right on the aiming point. I missed an amended tower clearance once and Jake had to catch it for me. I still need to work on deciding earlier when I should call a go-around instead of trying to save an unstable approach. Jake wanted me to keep working crosswinds and get stabilized earlier so I'm not trying to fix the speed at the threshold. I thought the crosswinds were actually going pretty well and liked keeping the airplane on centerline. Radio calls were clear and confident again.";

const MIA_FLIGHT_3_EVIDENCE_OVERRIDES = {
  "On the crosswind landings you still need to work on holding the correction once you get into the flare.": {
    category: "SEQUENCING_REHEARSAL",
  },
  "I missed an amended tower clearance once and Jake had to catch it for me.": {
    category: "COMMUNICATION_PERFORMANCE",
  },
  "I still need to work on deciding earlier when I should call a go-around instead of trying to save an unstable approach.": {
    category: "UNDERSTANDING_KNOWLEDGE",
  },
};

function analyze(transcript, hasInstructor = true) {
  return analyzeMock({
    transcript,
    flightMeta: { instructorName: "Jake", hasInstructor },
    previousActionItems: [],
  });
}

const result1 = analyze(MIA_FLIGHT_1_TRANSCRIPT);
const result2 = analyze(MIA_FLIGHT_2_TRANSCRIPT);
const result3 = analyze(MIA_FLIGHT_3_TRANSCRIPT);

console.log("--- Flight 3 needsWork sentences (should be exactly 3: crosswind, tower, go-around) ---");
console.log(result3.needsWork);

console.log("\n--- Flight 3: per-sentence skill match (via the REAL resolveTrainingItemSkill) + resolved strategy ---");
// flightTaskCodes = the 3 real logged tasks on flight-mia-3 (MIA_ASSESSMENT_TASKS)
const flightTaskCodes = new Set(["CROSSWIND_LANDING", "STABILIZED_APPROACH", "SHORT_FIELD_LANDING"]);
const debriefId = "debrief-mia-3";
const flight3Signals = classifyTrainingSignals(result3).map((d, i) => ({
  ...d,
  id: `${debriefId}-signal-${i}`,
  organizationId: "org-falcon",
  studentId: "user-mia",
  instructorId: "user-jake",
  aircraftId: "aircraft-c172s-n4521p",
  flightId: "flight-mia-3",
  debriefId,
  flightDate: "2026-09-08",
  dismissed: false,
  createdAt: "2026-09-08T00:00:00.000Z",
}));
for (const sentence of result3.needsWork) {
  const item = { id: "x", flightId: "flight-mia-3", debriefId, category: "keep_working_on", description: sentence, done: false, completedAt: null, visibility: "shared", instructorQuote: null, observedMechanism: null, createdAt: "2026-09-08T00:00:00.000Z" };
  const skill = resolveTrainingItemSkill(item, flight3Signals, flightTaskCodes);
  const override = MIA_FLIGHT_3_EVIDENCE_OVERRIDES[sentence];
  const mechanism = override ? { quote: sentence, category: override.category } : null;
  const strategy = skill
    ? resolveVectorStrategy({ skill, mechanism, activityEvidence: null, cfiName: "Jake", fallbackEvidenceText: sentence })
    : null;
  console.log({ sentence, resolvedSkill: skill, resolvedSkillLabel: skill ? skillLabel(skill) : null, mechanismCategory: mechanism?.category ?? null, strategy });
}

console.log("\n--- Longitudinal signals across all 3 flights (Still Working On candidates) ---");
const allSignals = [
  ...classifyTrainingSignals(result1).map((s) => ({ ...s, flightDate: "2026-08-01" })),
  ...classifyTrainingSignals(result2).map((s) => ({ ...s, flightDate: "2026-08-15" })),
  ...classifyTrainingSignals(result3).map((s) => ({ ...s, flightDate: "2026-09-08" })),
];
const progressions = computeSkillProgression(allSignals);
console.log(progressions.map((p) => ({ skill: p.skill, label: skillLabel(p.skill), status: p.status })));

console.log("\n--- Sanity: after resolution + bySkill dedup, does today's deck (flight 3) contain a STABILIZED_APPROACH or TRAFFIC_PATTERN unit? ---");
const bySkill = new Map();
for (const sentence of result3.needsWork) {
  const item = { id: "x", flightId: "flight-mia-3", debriefId, category: "keep_working_on", description: sentence, done: false, completedAt: null, visibility: "shared", instructorQuote: null, observedMechanism: null, createdAt: "2026-09-08T00:00:00.000Z" };
  const skill = resolveTrainingItemSkill(item, flight3Signals, flightTaskCodes);
  if (skill && !bySkill.has(skill)) bySkill.set(skill, sentence);
}
console.log("Deck skills:", [...bySkill.keys()]);
const leaked = [...bySkill.keys()].filter((s) => s === "STABILIZED_APPROACH" || s === "TRAFFIC_PATTERN");
console.log(leaked.length ? `FOUND leaked into deck (should NOT happen): ${leaked.join(", ")}` : "(none leaked into today's deck -- correct)");
