import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import type { TrainingSkill } from "@/lib/types";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { contestedObjective } from "@/lib/chair-fly";
import { hasAuthoredScenario } from "@/lib/prototype/chair-fly";
import { allTrainingSkills, skillLabel } from "@/lib/topics";
import { isPhysicalSkill } from "@/lib/training-skill-kind";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatFlightDate } from "@/lib/utils";
import { evidenceForSkill, resolveVectorCapability, type VectorCapability } from "@/lib/student/vector-coaching";

export interface VectorSessionProps {
  skillLabel: string;
  isPhysicalSkill: boolean;
  evidence: { label: string; text: string } | null;
  capability: VectorCapability;
  /** An authored Chair Fly scenario exists for this skill at all -- offered as a bonus next step after a check-branch session, even when it wasn't the reason this session opened (see the Landings example: a knowledge check can still end with "Rehearse with Vector"). */
  hasChairFlyOption: boolean;
  hrefs: { chairFlyHref: string; radioPracticeHref: string };
}

/**
 * Real /train/vector/[skill] -- the one destination "Train with Vector"
 * always links to. Independently re-derives everything from this student's
 * own real signals/debrief rather than trusting anything passed through the
 * URL beyond which skill to focus on, so a stale or bookmarked link can
 * never borrow another skill's evidence or drill.
 */
export async function buildVectorSessionProps(
  repo: Repository,
  viewer: Viewer,
  skillParam: string,
  hrefs: { chairFlyHref: string; radioPracticeHref: string },
): Promise<VectorSessionProps> {
  const studentId = viewer.user.id;
  const skill: TrainingSkill | "general" = skillParam === "general" ? "general" : (skillParam as TrainingSkill);

  const brief = await computeNextLessonBrief(repo, studentId);
  const cfi = resolveCfiFirstName(brief.lastInstructor);
  const lastDebrief = brief.lastFlight ? await repo.getDebriefByFlight(brief.lastFlight.id) : null;
  const contestedRaw = contestedObjective(lastDebrief?.structuredResult.assessmentDifferences ?? []);
  const contestedSkill = contestedRaw
    ? allTrainingSkills().find((t) => t.label.toLowerCase() === contestedRaw.taskLabel.toLowerCase())?.skill
    : undefined;
  // Only the contested objective that actually resolves to THIS session's
  // skill counts -- otherwise a stale link could borrow a different
  // objective's Chair Fly drill.
  const contested = contestedSkill === skill ? contestedRaw : null;

  const signals = await repo.listTrainingSignals({ studentId });
  const evidenceRow = evidenceForSkill(signals, skill);
  const evidence = evidenceRow
    ? { label: `${cfi ?? "Your instructor"} · ${formatFlightDate(evidenceRow.flightDate)}`, text: evidenceRow.text }
    : null;

  return {
    skillLabel: skill === "general" ? "this focus" : skillLabel(skill),
    isPhysicalSkill: skill !== "general" && isPhysicalSkill(skill),
    evidence,
    capability: resolveVectorCapability({ skill, contested }),
    hasChairFlyOption: skill !== "general" && hasAuthoredScenario(skillLabel(skill)),
    hrefs,
  };
}
