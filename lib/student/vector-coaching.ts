import type { AssessmentDifference, TrainingSignal, TrainingSkill } from "@/lib/types";
import { curatedTrainingGuidance, type CuratedTrainingGuidance } from "@/lib/topics";
import { hasAuthoredScenario } from "@/lib/prototype/chair-fly";

/**
 * Vector Train's routing layer.
 *
 * Train itself never branches on capability -- "Train with Vector" always
 * means the same thing: enter a Vector training session. The branching
 * (existing Chair Fly engine, existing Radio Practice engine, or Vector's
 * own bounded knowledge-check interaction) happens one layer in, inside
 * /train/vector/[skill] itself (see resolveVectorCapability below), so the
 * student's mental model stays "Train with Vector -> Vector trains me," not
 * "choose among unrelated tools."
 */

export interface VectorSession {
  buttonLabel: "Train with Vector";
  href: string;
}

/**
 * Train's one button, always a real link -- never a dead end, never a
 * local-state reveal. "general" is the honest fallback for the rare case
 * where a recommendation has a label but no matching TrainingSkill code at
 * all (see lib/training-memory.ts's resolvedSkill doc comment); the session
 * route itself degrades gracefully for that case rather than Train needing
 * to know about it.
 */
export function buildVectorSession(resolvedSkill: TrainingSkill | null): VectorSession {
  return { buttonLabel: "Train with Vector", href: `/train/vector/${resolvedSkill ?? "general"}` };
}

export type VectorCapability =
  | { kind: "chair-fly" }
  | { kind: "radio-practice" }
  | { kind: "check"; guidance: CuratedTrainingGuidance | null };

/**
 * What /train/vector/[skill] actually does once the student is there.
 *
 * Chair Fly requires a real contested objective, not just a matching skill
 * code -- lib/student/chair-fly-production-adapter.ts's drill is built from
 * the contested comparison itself (student's rating vs instructor's), so
 * there is no honest drill to offer without one. This mirrors that adapter's
 * own gate exactly.
 */
export function resolveVectorCapability(params: {
  skill: TrainingSkill | "general";
  contested: AssessmentDifference | null;
}): VectorCapability {
  if (params.contested && hasAuthoredScenario(params.contested.taskLabel)) {
    return { kind: "chair-fly" };
  }
  if (params.skill === "RADIO_COMMUNICATIONS") {
    return { kind: "radio-practice" };
  }
  return { kind: "check", guidance: params.skill === "general" ? null : curatedTrainingGuidance(params.skill) };
}

/**
 * The most recent real instructor-sourced evidence for one skill, across
 * this student's own training signals -- never a fixture, never another
 * student's. "general" (no resolved skill) has nothing to key evidence off
 * of, so it's always null there.
 */
export function evidenceForSkill(
  signals: TrainingSignal[],
  skill: TrainingSkill | "general",
): { text: string; flightDate: string } | null {
  if (skill === "general") return null;
  const matches = signals
    .filter((s) => s.skill === skill && !s.dismissed && s.source !== "STUDENT" && s.statement)
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate));
  const latest = matches[0];
  return latest ? { text: latest.statement, flightDate: latest.flightDate } : null;
}
