import { performanceLevelRank } from "@/lib/performance-levels";
import type { AssessmentDifference } from "@/lib/types";

/**
 * Which real objective is worth rehearsing -- the production equivalent of
 * lib/prototype/chair-fly.ts's contestedObjective(), against real
 * AssessmentDifference rows instead of the fixture PERCEPTION_GAPS. Shared
 * by Train (to decide whether to offer "Start chair flying" at all) and
 * /train/chair-fly (to build the real drill) so the two can never pick a
 * different objective than the button promised.
 *
 * A real contested objective outranks the weakest open skill or recurring
 * theme: the task the student rated HIGHER than the instructor did, largest
 * gap first, since that's the one nobody would choose to rehearse on their
 * own. Only ever non-empty for a guided-mode debrief with real per-task
 * ratings; a freeform debrief's assessmentDifferences is always [].
 */
export function contestedObjective(differences: AssessmentDifference[]): AssessmentDifference | null {
  const studentHigher = differences
    .filter((d) => performanceLevelRank(d.studentLevel) > performanceLevelRank(d.instructorLevel))
    .sort(
      (a, b) =>
        performanceLevelRank(b.studentLevel) - performanceLevelRank(b.instructorLevel) -
        (performanceLevelRank(a.studentLevel) - performanceLevelRank(a.instructorLevel)),
    );
  if (studentHigher[0]) return studentHigher[0];
  return differences.find((d) => d.instructorLevel !== "INDEPENDENT") ?? null;
}
