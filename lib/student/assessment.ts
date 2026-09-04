import {
  PERFORMANCE_LEVELS,
  performanceLevelLabelFor,
  performanceLevelRank,
  type PerformanceLevelCode,
} from "@/lib/performance-levels";
import type { SkillState } from "@/lib/student/state-tone";

/**
 * The objective-level assessment vocabulary for the guided debrief.
 *
 * Deliberately NOT a new scoring system, and deliberately not a second copy
 * of one: the codes, their order, their rank, and the role-specific labels
 * ("Felt Solid" vs "Meets Standard" over the same INDEPENDENT code) are all
 * lib/performance-levels.ts's -- the same module components/debrief/
 * performance-level-picker.tsx (the real rating control) already uses. This
 * file used to maintain its own copy of that label map; two copies of the
 * same student/instructor wording is exactly the drift this file exists to
 * avoid now.
 */
export const ASSESSMENT_LEVELS: PerformanceLevelCode[] = PERFORMANCE_LEVELS.map((l) => l.code);

export type Rater = "student" | "instructor";

export function levelLabel(code: PerformanceLevelCode, rater: Rater): string {
  return performanceLevelLabelFor(code, rater);
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

/** Agreement is information too, so this reads both ways rather than counting faults. */
export function agreementSummary(rows: { student: PerformanceLevelCode; instructor: PerformanceLevelCode }[]): string {
  const total = rows.length;
  const same = rows.filter((r) => agreement(r.student, r.instructor) === "aligned").length;
  if (same === total) return `You and your instructor rated all ${total} objectives the same way.`;
  if (same === 0) return `You saw all ${total} objectives differently. That is worth talking through.`;
  return `You agreed on ${same} of ${total}. The rest is worth talking through.`;
}
