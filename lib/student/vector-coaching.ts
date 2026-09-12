import type { TrainingSkill } from "@/lib/types";
import { categoryForSkill, skillLabel } from "@/lib/topics";
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
 * training unit (lib/student/train-units.ts).
 */

export interface VectorSession {
  buttonLabel: "Train with Vector";
  href: string;
}

/** Every Train card's one button, always a real link keyed by that unit's own TrainingItem id -- never a dead end, never a local-state reveal. */
export function buildVectorSession(itemId: string): VectorSession {
  return { buttonLabel: "Train with Vector", href: `/train/vector/${itemId}` };
}

export type RehearsalEngine = { kind: "chair-fly" } | { kind: "radio-practice" };

/**
 * A real interactive engine available for this skill, independent of
 * whether Vector's own diagnostic question exists for it. Availability is
 * never decided by a single hardcoded skill literal: Chair Fly checks the
 * scenario bank itself (hasAuthoredScenario); Radio Practice requires BOTH
 * the skill's own TOPIC_LIBRARY category being COMMUNICATIONS (so a
 * physical/procedural skill a radio scenario merely happens to touch, like
 * GO_AROUND or EMERGENCY_PROCEDURES, is never routed here wholesale) AND a
 * real scenario tagged with it (RADIO_PRACTICE_SKILLS, above).
 */
export function rehearsalEngineFor(skill: TrainingSkill | "general"): RehearsalEngine | null {
  if (skill === "general") return null;
  if (hasAuthoredScenario(skillLabel(skill))) return { kind: "chair-fly" };
  if (categoryForSkill(skill) === "COMMUNICATIONS" && RADIO_PRACTICE_SKILLS.has(skill)) return { kind: "radio-practice" };
  return null;
}

export interface VectorDiagnosis {
  /** How many of the question's expectedConcepts this answer actually conveyed, per evaluateVectorAnswer. */
  matchedConceptCount: number;
  expectedConceptCount: number;
}

export type VectorStrategy =
  | { kind: "chair-fly" }
  | { kind: "radio-practice" }
  | { kind: "retry"; hint: string }
  | { kind: "done"; objective: string };

/**
 * The one appropriate next move, decided AFTER Vector's diagnostic
 * interaction (or immediately, honestly, when no diagnostic question
 * exists to run) -- never a capability preselected from the skill alone
 * before the student has said anything.
 *
 * Deterministic, not LLM-guessed: the only signal is the diagnosis's own
 * matched-vs-expected concept count (itself grounded, from
 * evaluateVectorAnswer) plus the two independently-real capability-
 * availability facts. This is the seam for richer adaptation later
 * (multiple diagnostic rounds, ADM scenario variation) -- extending it
 * doesn't require a new architecture, just a richer decision here.
 *
 * - A real conceptual gap (fewer than half the expected concepts matched)
 *   with real retry material and no retry spent yet -> one more grounded
 *   round, framed by a curated common error, never a new authored
 *   question.
 * - Otherwise, if a rehearsal engine exists for this skill, that's the
 *   appropriate activity regardless of how well the concept question went
 *   -- physical/procedural execution is fixed by rehearsing it, not by
 *   further Q&A.
 * - Otherwise, the legitimate terminal outcome: no more ground training
 *   needed for this item, carry one explicit objective into the next
 *   flight.
 */
export function resolveVectorStrategy(params: {
  skill: TrainingSkill | "general";
  diagnosis: VectorDiagnosis | null;
  retried: boolean;
  commonErrors: string[];
  objective: string;
}): VectorStrategy {
  const { diagnosis, retried, commonErrors, objective } = params;
  const engine = rehearsalEngineFor(params.skill);

  if (diagnosis && !retried && commonErrors.length > 0) {
    const gap = diagnosis.expectedConceptCount > 0 && diagnosis.matchedConceptCount * 2 < diagnosis.expectedConceptCount;
    if (gap) return { kind: "retry", hint: commonErrors[0] };
  }

  if (engine) return engine;
  return { kind: "done", objective };
}
