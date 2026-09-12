import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import { skillLabel } from "@/lib/topics";
import { isPhysicalSkill } from "@/lib/training-skill-kind";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatFlightDate } from "@/lib/utils";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { resolveOwnedTrainingItem } from "@/lib/student/train-units";
import { resolveVectorCapability, type VectorCapability } from "@/lib/student/vector-coaching";

export interface VectorSessionProps {
  skillLabel: string;
  isPhysicalSkill: boolean;
  evidence: { label: string; text: string };
  capability: VectorCapability;
  hrefs: { chairFlyHref: string; radioPracticeHref: string };
}

/**
 * Real /train/vector/[itemId] -- the one destination "Train with Vector"
 * always links to, one per TrainingItem/Vector-training-unit
 * (lib/student/train-units.ts). Everything is derived server-side from the
 * signed-in student's own real data; the itemId is only ever a lookup key,
 * never trusted for evidence, skill, or grounding.
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

  const brief = await computeNextLessonBrief(repo, studentId);
  const cfi = resolveCfiFirstName(brief.lastInstructor);
  const flight = brief.lastFlight?.id === item.flightId ? brief.lastFlight : null;
  const evidenceLabel = `${cfi ?? "Your instructor"} · ${flight ? formatFlightDate(flight.flightDate) : ""}`.trim();

  return {
    skillLabel: skillLabel(skill),
    isPhysicalSkill: isPhysicalSkill(skill),
    evidence: { label: evidenceLabel, text: item.description },
    capability: resolveVectorCapability({ skill }),
    hrefs,
  };
}
