import { performanceLevelRank, type PerformanceLevelCode } from "@/lib/performance-levels";
import { PERCEPTION_GAPS, SKILL_SCORES, type SkillState } from "@/lib/prototype/vector-data";

/**
 * The objective-level assessment vocabulary for the guided debrief.
 *
 * Deliberately NOT a new scoring system. The codes, their order and their
 * rank function are the shared FITS-derived model in lib/performance-levels.ts
 * -- only the wording differs, which that file explicitly anticipates by
 * persisting the code and never the label.
 *
 * Two label sets over one scale, because the two people rating are answering
 * different questions. A student cannot honestly report "Meets Standard"
 * about a standard nobody has shown them; "Felt Solid" is a claim about their
 * own experience, which is the only thing they are actually qualified to
 * report. The instructor IS judging against the ACS, so their top level keeps
 * the formal wording. Same code underneath, so the comparison stays valid.
 */
export const ASSESSMENT_LEVELS: PerformanceLevelCode[] = ["LEARNING", "NEEDS_COACHING", "INDEPENDENT"];

const STUDENT_LABELS: Record<PerformanceLevelCode, string> = {
  LEARNING: "Needs Work",
  NEEDS_COACHING: "Improving",
  INDEPENDENT: "Felt Solid",
};

const INSTRUCTOR_LABELS: Record<PerformanceLevelCode, string> = {
  LEARNING: "Needs Work",
  NEEDS_COACHING: "Improving",
  INDEPENDENT: "Meets Standard",
};

export type Rater = "student" | "instructor";

export function levelLabel(code: PerformanceLevelCode, rater: Rater): string {
  return rater === "student" ? STUDENT_LABELS[code] : INSTRUCTOR_LABELS[code];
}

/**
 * Maps an assessment level onto the app's existing three-state color scale so
 * objective ratings and skill meters read as one system rather than two.
 */
export function levelState(code: PerformanceLevelCode): SkillState {
  if (code === "INDEPENDENT") return "Meets Standard";
  if (code === "NEEDS_COACHING") return "Improving";
  return "Needs Work";
}

export function levelScore(code: PerformanceLevelCode): number {
  return performanceLevelRank(code) + 1;
}

export type Agreement = "aligned" | "student_higher" | "instructor_higher";

export function agreement(student: PerformanceLevelCode, instructor: PerformanceLevelCode): Agreement {
  const d = performanceLevelRank(student) - performanceLevelRank(instructor);
  if (d === 0) return "aligned";
  return d > 0 ? "student_higher" : "instructor_higher";
}

/**
 * The objectives planned for the lesson, taken from the same rows that carry
 * the assessments. One list, so a task can never be rated in the flow and then
 * go missing from the comparison.
 */
export const LESSON_OBJECTIVES = PERCEPTION_GAPS.map((g) => g.task);

/** Agreement is information too, so this reads both ways rather than counting faults. */
export function agreementSummary(rows: { student: PerformanceLevelCode; instructor: PerformanceLevelCode }[]): string {
  const total = rows.length;
  const same = rows.filter((r) => agreement(r.student, r.instructor) === "aligned").length;
  if (same === total) return `You and your instructor rated all ${total} objectives the same way.`;
  if (same === 0) return `You saw all ${total} objectives differently. That is worth talking through.`;
  return `You agreed on ${same} of ${total}. The rest is worth talking through.`;
}

/**
 * Matches a skill to the lesson objective it was rated under.
 *
 * The two vocabularies drifted apart in the seed -- "Crosswind Landings" as an
 * objective, "Crosswind Landing" as a skill -- so this compares them loosely
 * rather than requiring the strings to be kept in sync by hand. Returns
 * undefined for skills the last flight did not cover, which is the common
 * case and not an error.
 */
function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, "").replace(/s$/, "");
}

export function objectiveForSkill(skillName: string) {
  return PERCEPTION_GAPS.find((g) => normalize(g.task) === normalize(skillName));
}

/**
 * The reverse of objectiveForSkill: the skill row a lesson objective was
 * scored under.
 *
 * Same loose comparison, for the same reason -- the seed says "Crosswind
 * Landings" as an objective and "Crosswind Landing" as a skill, and keeping
 * two vocabularies in sync by hand is how they drift. Returns undefined when
 * an objective has no matching skill row, which is a real case and not an
 * error.
 */
export function skillForObjective(task: string) {
  return SKILL_SCORES.find((s) => normalize(s.skill) === normalize(task));
}
