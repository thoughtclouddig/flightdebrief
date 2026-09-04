/**
 * Student-facing performance levels for the guided debrief, based on the FAA
 * FITS (learner-centered grading) Describe -> Explain -> Practice -> Perform
 * scale. Raw FAA terminology isn't intuitive to students, so the app uses
 * friendlier labels while keeping the FITS-equivalent mapping documented
 * here as the single source of truth. Only the code (never the label) is
 * ever persisted, so relabeling later touches zero historical rows.
 */
export type PerformanceLevelCode = "LEARNING" | "NEEDS_COACHING" | "INDEPENDENT";

export const PERFORMANCE_LEVELS: { code: PerformanceLevelCode; label: string; fitsEquivalent: string }[] = [
  { code: "LEARNING", label: "Learning", fitsEquivalent: "Describe / Explain" },
  { code: "NEEDS_COACHING", label: "Needs Coaching", fitsEquivalent: "Practice" },
  { code: "INDEPENDENT", label: "Independent", fitsEquivalent: "Perform" },
];

export function performanceLevelLabel(code: PerformanceLevelCode): string {
  return PERFORMANCE_LEVELS.find((l) => l.code === code)?.label ?? code;
}

/**
 * Role-specific presentation labels -- same three underlying codes, two
 * different questions. A student rating their own flight is answering "how
 * did this feel to me?", not judging themselves against the training
 * standard, so INDEPENDENT reads as "Felt Solid" rather than "Meets
 * Standard" -- that's the instructor's call to make, not something to ask a
 * student who may not yet know the standard. Presentation only: the stored
 * code and PERFORMANCE_LEVELS' ordering/rank are unaffected.
 */
const STUDENT_LEVEL_LABELS: Record<PerformanceLevelCode, string> = {
  LEARNING: "Needs Work",
  NEEDS_COACHING: "Improving",
  INDEPENDENT: "Felt Solid",
};

const INSTRUCTOR_LEVEL_LABELS: Record<PerformanceLevelCode, string> = {
  LEARNING: "Needs Work",
  NEEDS_COACHING: "Improving",
  INDEPENDENT: "Meets Standard",
};

export function performanceLevelLabelFor(code: PerformanceLevelCode, rater: "student" | "instructor"): string {
  return rater === "student" ? STUDENT_LEVEL_LABELS[code] : INSTRUCTOR_LEVEL_LABELS[code];
}

/** Ordinal rank for computing discrepancy distance between two ratings. */
export function performanceLevelRank(code: PerformanceLevelCode): number {
  return PERFORMANCE_LEVELS.findIndex((l) => l.code === code);
}
