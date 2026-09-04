import { PERCEPTION_GAPS, SKILL_SCORES } from "@/lib/prototype-fixtures/vector-data";

/**
 * Cross-references between the prototype's two independently-authored
 * fixture vocabularies (lesson objectives vs. skill catalog) -- genuinely
 * fixture-scoped, unlike the rest of what used to live in this file (now
 * lib/student/assessment.ts). "Crosswind Landings" as an objective,
 * "Crosswind Landing" as a skill: the seed drifted, so this compares
 * loosely rather than requiring the strings to be kept in sync by hand.
 * Returns undefined for the common case of no match, not an error.
 */
function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, "").replace(/s$/, "");
}

export function objectiveForSkill(skillName: string) {
  return PERCEPTION_GAPS.find((g) => normalize(g.task) === normalize(skillName));
}

export function skillForObjective(task: string) {
  return SKILL_SCORES.find((s) => normalize(s.skill) === normalize(task));
}
