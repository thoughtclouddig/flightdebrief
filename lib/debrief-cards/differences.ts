import { performanceLevelRank, type PerformanceLevelCode } from "@/lib/performance-levels";
import type { AssessmentDifference } from "@/lib/types";

/**
 * Pure, deterministic -- never asked of Claude (same "don't trust the LLM for
 * things we can compute exactly" rule as studyReferences). Only tasks both
 * raters actually scored, and only where they disagree, are reported.
 */
export function computeAssessmentDifferences(
  taskLabels: Map<string, string>,
  studentRatings: Map<string, PerformanceLevelCode>,
  instructorRatings: Map<string, PerformanceLevelCode>,
): AssessmentDifference[] {
  const differences: AssessmentDifference[] = [];
  for (const [taskCode, studentLevel] of studentRatings) {
    const instructorLevel = instructorRatings.get(taskCode);
    if (!instructorLevel) continue;
    if (performanceLevelRank(studentLevel) === performanceLevelRank(instructorLevel)) continue;
    differences.push({
      taskLabel: taskLabels.get(taskCode) ?? taskCode,
      studentLevel,
      instructorLevel,
      note: "",
    });
  }
  return differences;
}
