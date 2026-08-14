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

/** Ordinal rank for computing discrepancy distance between two ratings. */
export function performanceLevelRank(code: PerformanceLevelCode): number {
  return PERFORMANCE_LEVELS.findIndex((l) => l.code === code);
}
