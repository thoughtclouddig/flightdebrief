import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import { skillLabel } from "@/lib/topics";
import { isPhysicalSkill } from "@/lib/training-skill-kind";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatFlightDate } from "@/lib/utils";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { resolveOwnedTrainingItem } from "@/lib/student/train-units";
import { resolveVectorStrategy, type ActivityEvidence, type VectorStrategy } from "@/lib/student/vector-coaching";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";

export interface VectorSessionProps {
  skillLabel: string;
  isPhysicalSkill: boolean;
  evidence: { label: string; text: string };
  /** The one appropriate next move, already decided server-side from this unit's real mechanism and (if one already ran) real activity evidence -- never preselected from the skill alone, never re-decided client-side. */
  strategy: VectorStrategy;
  itemId: string;
  /** Deterministic scenario pick for this skill, when strategy routes to Radio Practice and no attempt is linked to this unit yet. */
  radioScenarioId: string | null;
  /** The id of ANY Radio Practice assignment already linked to this unit, regardless of status -- resumes an incomplete attempt, or reopens a completed one for its own "Try Again" flow when strategy is a retry. Null when none exists yet. */
  radioPracticeAssignmentId: string | null;
  hrefs: { chairFlyHref: string; radioPracticeHref: string };
}

/**
 * Real /train/vector/[itemId] -- the one destination "Train with Vector"
 * always links to, one per TrainingItem/Vector-training-unit
 * (lib/student/train-units.ts). Everything is derived server-side from the
 * signed-in student's own real data; the itemId is only ever a lookup key,
 * never trusted for evidence, skill, mechanism, or activity results.
 *
 * Re-fetches this unit's own Radio Practice attempts (never trusting a
 * client-supplied result): a completed one linked to this itemId becomes
 * real activity evidence for round 2 of resolveVectorStrategy, including
 * its real attempts count (the bound for the one retry offered there); an
 * incomplete one is resumed rather than duplicated.
 *
 * Reads this item's instructorQuote/observedMechanism straight off the row
 * -- both were computed once, when the item was created
 * (app/api/debrief/analyze/route.ts), and never recomputed here. This is
 * what guarantees Train's card list and this exact session can never
 * disagree about the same TrainingItem: neither one ever calls the model.
 *
 * Returns null when resolveOwnedTrainingItem can't establish that this item
 * belongs to this student as a real, skill-resolvable unit -- the caller
 * (the page) treats null as notFound().
 */
export async function buildVectorSessionProps(
  repo: Repository,
  viewer: Viewer,
  itemId: string,
  hrefs: { chairFlyHref: string; radioPracticeHref: string },
): Promise<VectorSessionProps | null> {
  const studentId = viewer.user.id;
  const owned = await resolveOwnedTrainingItem(repo, studentId, itemId);
  if (!owned) return null;
  const { item, skill } = owned;

  const [brief, assignments] = await Promise.all([
    computeNextLessonBrief(repo, studentId),
    repo.listRadioPracticeAssignments(studentId),
  ]);
  const cfi = resolveCfiFirstName(brief.lastInstructor);
  const cfiName = cfi ?? "your instructor";
  const flight = brief.lastFlight?.id === item.flightId ? brief.lastFlight : null;
  const evidenceLabel = `${cfi ?? "Your instructor"} · ${flight ? formatFlightDate(flight.flightDate) : ""}`.trim();

  const linked = assignments.find((a) => a.trainingItemId === itemId) ?? null;
  const activityEvidence: ActivityEvidence | null =
    linked?.status === "completed"
      ? { kind: "radio-practice", correct: linked.correct ?? false, matchedElements: linked.matchedElements ?? [], attempts: linked.attempts }
      : null;

  const strategy = resolveVectorStrategy({
    skill,
    mechanism: item.observedMechanism,
    activityEvidence,
    cfiName,
    fallbackEvidenceText: item.description,
  });

  return {
    skillLabel: skillLabel(skill),
    isPhysicalSkill: isPhysicalSkill(skill),
    evidence: { label: evidenceLabel, text: item.description },
    strategy,
    itemId,
    radioScenarioId: RADIO_PRACTICE_SCENARIOS.find((s) => s.skill === skill)?.id ?? null,
    radioPracticeAssignmentId: linked?.id ?? null,
    hrefs,
  };
}
