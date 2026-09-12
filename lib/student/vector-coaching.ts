import type { TrainingSkill } from "@/lib/types";
import { categoryForSkill, curatedTrainingGuidance, skillLabel, type CuratedTrainingGuidance } from "@/lib/topics";
import { hasAuthoredScenario } from "@/lib/prototype/chair-fly";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";

/**
 * Skills Radio Practice can actually route a student into -- a real
 * scenario exists for it, not merely a plausible-sounding skill code.
 * Computed from the scenario bank itself so this can never drift out of
 * sync with what the engine really covers.
 */
const RADIO_PRACTICE_SKILLS: ReadonlySet<TrainingSkill> = new Set(RADIO_PRACTICE_SCENARIOS.map((s) => s.skill));

/**
 * Vector Train's routing layer.
 *
 * Train itself never branches on capability -- "Train with Vector" always
 * means the same thing: enter a Vector training session for one specific
 * training unit (lib/student/train-units.ts). The branching (existing Chair
 * Fly engine, existing Radio Practice engine, or Vector's own bounded
 * knowledge-check interaction) happens one layer in, inside
 * /train/vector/[itemId] itself (see resolveVectorCapability below), so the
 * student's mental model stays "Train with Vector -> Vector trains me," not
 * "choose among unrelated tools."
 */

export interface VectorSession {
  buttonLabel: "Train with Vector";
  href: string;
}

/** Every Train card's one button, always a real link keyed by that unit's own TrainingItem id -- never a dead end, never a local-state reveal. */
export function buildVectorSession(itemId: string): VectorSession {
  return { buttonLabel: "Train with Vector", href: `/train/vector/${itemId}` };
}

export type VectorCapability =
  | { kind: "chair-fly" }
  | { kind: "radio-practice" }
  | { kind: "check"; guidance: CuratedTrainingGuidance | null };

/**
 * What /train/vector/[itemId] actually does once the student is there.
 *
 * Chair Fly is keyed purely on the unit's own resolved skill -- no
 * contested/dual-assessment requirement. A freeform debrief never produces
 * a contested comparison, and gating Chair Fly on one meant it could never
 * fire for the far more common freeform case even when the evidence
 * squarely supports a real authored scenario.
 * lib/student/chair-fly-production-adapter.ts builds the actual drill from
 * whichever framing is available (a real perception-gap comparison when
 * one exists, this unit's own debrief evidence otherwise) -- that choice
 * doesn't change whether Chair Fly is offered at all.
 *
 * Radio Practice requires BOTH of two independently real, already-curated
 * facts, never a single hardcoded skill literal: the skill's own
 * TOPIC_LIBRARY category is "COMMUNICATIONS" (so a skill like GO_AROUND or
 * EMERGENCY_PROCEDURES -- physical/procedural skills a couple of radio
 * scenarios happen to touch -- never gets routed here wholesale on that
 * coincidence alone), AND the scenario bank actually has a scenario tagged
 * with it (RADIO_PRACTICE_SKILLS, above). Failing either check falls to
 * `check`, never a false "Train with Vector" promise -- a skill this
 * doesn't recognize as an interactive engine still gets Vector's own
 * grounded coaching when curated, or an honest "nothing prepared" when not.
 */
export function resolveVectorCapability(params: { skill: TrainingSkill | "general" }): VectorCapability {
  if (params.skill !== "general" && hasAuthoredScenario(skillLabel(params.skill))) {
    return { kind: "chair-fly" };
  }
  if (params.skill !== "general" && categoryForSkill(params.skill) === "COMMUNICATIONS" && RADIO_PRACTICE_SKILLS.has(params.skill)) {
    return { kind: "radio-practice" };
  }
  return { kind: "check", guidance: params.skill === "general" ? null : curatedTrainingGuidance(params.skill) };
}
