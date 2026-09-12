import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import { curatedTrainingGuidance, skillLabel } from "@/lib/topics";
import { isPhysicalSkill } from "@/lib/training-skill-kind";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatFlightDate } from "@/lib/utils";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { resolveOwnedTrainingItem } from "@/lib/student/train-units";
import { rehearsalEngineFor, type RehearsalEngine } from "@/lib/student/vector-coaching";

export interface VectorSessionProps {
  skillLabel: string;
  isPhysicalSkill: boolean;
  evidence: { label: string; text: string };
  /** Vector's one grounded diagnostic question for this skill, or null when none is curated yet. explanation is the honest, no-network-call fallback -- never a substitute for a real evaluation. */
  diagnosticQuestion: { prompt: string; explanation: string } | null;
  /** A real interactive engine available for this skill -- the appropriate activity once diagnosis calls for it, decided server-side after the diagnostic exchange (or immediately when there is no diagnosticQuestion to run first). */
  rehearsal: RehearsalEngine | null;
  hrefs: { chairFlyHref: string; radioPracticeHref: string };
}

/**
 * Real /train/vector/[itemId] -- the one destination "Train with Vector"
 * always links to, one per TrainingItem/Vector-training-unit
 * (lib/student/train-units.ts). Everything is derived server-side from the
 * signed-in student's own real data; the itemId is only ever a lookup key,
 * never trusted for evidence, skill, or grounding.
 *
 * Deliberately does NOT preselect a single capability here -- that decision
 * (rehearse, retry, or done) is made by resolveVectorStrategy only after
 * the diagnostic exchange runs (see the evaluate route), never before the
 * student has answered anything. This just tells the client what's
 * available to route to: a diagnostic question when one is curated, and/or
 * a real rehearsal engine when one exists for this skill.
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

  const question = curatedTrainingGuidance(skill)?.checkQuestion ?? null;

  return {
    skillLabel: skillLabel(skill),
    isPhysicalSkill: isPhysicalSkill(skill),
    evidence: { label: evidenceLabel, text: item.description },
    diagnosticQuestion: question ? { prompt: question.prompt, explanation: question.explanation } : null,
    rehearsal: rehearsalEngineFor(skill),
    hrefs,
  };
}
