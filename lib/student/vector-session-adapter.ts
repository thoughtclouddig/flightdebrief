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
  /** An already-linked, not-yet-completed Radio Practice attempt for this unit -- the client resumes it rather than creating a duplicate. */
  pendingRadioPracticeAssignmentId: string | null;
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
 * real activity evidence for round 2 of resolveVectorStrategy; an
 * incomplete one is resumed rather than duplicated.
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
  const { item, skill, mechanism } = owned;

  const brief = await computeNextLessonBrief(repo, studentId);
  const cfi = resolveCfiFirstName(brief.lastInstructor);
  const flight = brief.lastFlight?.id === item.flightId ? brief.lastFlight : null;
  const evidenceLabel = `${cfi ?? "Your instructor"} · ${flight ? formatFlightDate(flight.flightDate) : ""}`.trim();

  const assignments = await repo.listRadioPracticeAssignments(studentId);
  const linked = assignments.find((a) => a.trainingItemId === itemId) ?? null;

  let activityEvidence: ActivityEvidence | null = null;
  let pendingRadioPracticeAssignmentId: string | null = null;
  if (linked?.status === "completed") {
    activityEvidence = { kind: "radio-practice", correct: linked.correct ?? false, matchedElements: linked.matchedElements ?? [] };
  } else if (linked) {
    pendingRadioPracticeAssignmentId = linked.id;
  }

  const strategy = resolveVectorStrategy({
    skill,
    mechanism,
    activityEvidence,
    cfiName: cfi ?? "your instructor",
    fallbackEvidenceText: item.description,
  });

  return {
    skillLabel: skillLabel(skill),
    isPhysicalSkill: isPhysicalSkill(skill),
    evidence: { label: evidenceLabel, text: item.description },
    strategy,
    itemId,
    radioScenarioId: RADIO_PRACTICE_SCENARIOS.find((s) => s.skill === skill)?.id ?? null,
    pendingRadioPracticeAssignmentId,
    hrefs,
  };
}
