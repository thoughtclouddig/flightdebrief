import type { TrainingSkill } from "@/lib/types";
import { categoryForSkill, curatedTrainingGuidance, skillLabel } from "@/lib/topics";
import { hasAuthoredScenario } from "@/lib/prototype/chair-fly";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";
import type { ObservedMechanism } from "@/lib/ai/evidence-mechanism";

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
 * whether a mechanism is known for it. Availability is never decided by a
 * single hardcoded skill literal: Chair Fly checks the scenario bank
 * itself (hasAuthoredScenario); Radio Practice requires BOTH the skill's
 * own TOPIC_LIBRARY category being COMMUNICATIONS (so a physical/
 * procedural skill a radio scenario merely happens to touch, like
 * GO_AROUND or EMERGENCY_PROCEDURES, is never routed here wholesale) AND a
 * real scenario tagged with it (RADIO_PRACTICE_SKILLS, above).
 */
export function rehearsalEngineFor(skill: TrainingSkill | "general"): RehearsalEngine | null {
  if (skill === "general") return null;
  if (hasAuthoredScenario(skillLabel(skill))) return { kind: "chair-fly" };
  if (categoryForSkill(skill) === "COMMUNICATIONS" && RADIO_PRACTICE_SKILLS.has(skill)) return { kind: "radio-practice" };
  return null;
}

/**
 * The real, structured result of having run a diagnostic activity this
 * session -- never a score invented to drive routing, always the actual
 * output of a real engine. Chair Fly never appears here: it produces no
 * result, by explicit design (see lib/prototype/chair-fly.ts), so it can
 * only ever be a destination, never a source of this evidence.
 *
 * `attempts` on the radio-practice variant is the assignment's own real
 * retry counter (RadioPracticeAssignment.attempts) -- the bound for the
 * one retry offered below, never an artificial score threshold.
 */
export type ActivityEvidence =
  | { kind: "radio-practice"; correct: boolean; matchedElements: { description: string; matched: boolean }[]; attempts: number }
  | { kind: "check"; matchedConceptCount: number; expectedConceptCount: number; takeaway: string };

export type VectorStrategy =
  | { kind: "chair-fly" }
  | { kind: "radio-practice"; mode: "train" | "diagnose" }
  | { kind: "radio-practice"; mode: "retry"; missedElement: string }
  | { kind: "coach"; message: string }
  | { kind: "check"; question: { prompt: string } }
  | { kind: "transfer"; objective: string };

function transferObjective(cfiName: string, focus: string): string {
  return `This came up in your debrief, but the next useful step is in the airplane. On your next flight, ask ${cfiName} to watch specifically for: ${focus}`;
}

/**
 * The one appropriate next move for a Vector training unit -- never a
 * capability preselected from the skill alone, never a score threshold
 * chosen as a universal modality selector.
 *
 * ROUND 2 -- `activityEvidence` present: a diagnostic activity already ran
 * this session (Radio Practice or Vector's own bounded Q&A). Decide from
 * its real, structured result, never from the skill.
 *   - Radio Practice, correct -> transfer (the scenario is handled, carry
 *     that confidence into an actual radio call).
 *   - Radio Practice, not correct, first attempt (attempts <= 1) -> a
 *     bounded retry: grounded coaching from the specific required element
 *     actually missed (real, structured -- never a generic "try harder"),
 *     and one more try at the same assignment. This is real diagnostic
 *     value, not discarded.
 *   - Radio Practice, still not correct after that retry -> transfer,
 *     framed by whichever element is still missed.
 *   - Vector's own bounded Q&A -> ALWAYS transfers, using the evaluator's
 *     own takeaway, regardless of how well the answer went. A knowledge
 *     question proves only what it tested -- it can never legitimately
 *     reopen Chair Fly, because it supplies no evidence at all about a
 *     sequencing/rehearsal/psychomotor need. (This was the exact defect
 *     found in the prior pass: "skill has Chair Fly + Q&A answer strong ->
 *     Chair Fly" is capability-driven routing wearing a diagnosis costume.)
 *
 * ROUND 1, mechanism known (`mechanism` present, no activity has run yet):
 * the mechanism's category -- derived entirely from the instructor's own
 * words by lib/ai/evidence-mechanism.ts's bounded extractor, never from
 * skill code or TOPIC_LIBRARY capability metadata -- decides the
 * candidate move, no generic preliminary question. But the category is
 * only ever a candidate: each case still verifies the real capability
 * actually exists for this skill before committing to it (a mechanism
 * extracted purely from words has no reason to agree with which engines
 * happen to be authored), falling through to transfer otherwise:
 *   - SEQUENCING_REHEARSAL -> Chair Fly, only if this skill actually has
 *     an authored scenario.
 *   - COMMUNICATION_PERFORMANCE -> Radio Practice, framed as the
 *     rehearsal itself (mode: "train"), only if this skill actually has
 *     one.
 *   - UNDERSTANDING_KNOWLEDGE -> direct coaching from the quote plus
 *     curated explanation, no quiz (always available -- coaching from a
 *     known quote needs no engine).
 *   - RECOGNITION / FLIGHT_EXECUTION_TRANSFER / a category whose engine
 *     doesn't actually exist -> transfer, objective built from the quote
 *     itself.
 *
 * ROUND 1, mechanism unknown: pick a legitimate diagnostic path -- Radio
 * Practice, performed, when this is a real communications skill (the
 * activity itself generates better diagnostic evidence than asking the
 * student to describe why radio is hard); Vector's own bounded Q&A when
 * curated content exists and no performance activity does; otherwise
 * transfer -- never the empty "nothing prepared" dead end.
 */
export function resolveVectorStrategy(params: {
  skill: TrainingSkill | "general";
  mechanism: ObservedMechanism | null;
  activityEvidence: ActivityEvidence | null;
  /** Already resolved to a display name -- "your instructor" when none is known. */
  cfiName: string;
  /** This unit's own TrainingItem evidence text -- the objective's grounding when nothing more specific (a mechanism quote, a takeaway) is available. */
  fallbackEvidenceText: string;
}): VectorStrategy {
  const { skill, mechanism, activityEvidence, cfiName, fallbackEvidenceText } = params;

  if (activityEvidence) {
    if (activityEvidence.kind === "radio-practice") {
      if (activityEvidence.correct) {
        return { kind: "transfer", objective: transferObjective(cfiName, "carrying that same confidence into an actual radio call") };
      }
      const missed = activityEvidence.matchedElements.find((e) => !e.matched)?.description ?? "the same call, on your next real radio contact";
      if (activityEvidence.attempts <= 1) {
        return { kind: "radio-practice", mode: "retry", missedElement: missed };
      }
      return { kind: "transfer", objective: transferObjective(cfiName, missed) };
    }

    // Vector's own bounded Q&A never reopens Chair Fly -- it proves only
    // whether the concepts it asked about were understood, never a
    // sequencing/rehearsal/psychomotor need.
    return { kind: "transfer", objective: transferObjective(cfiName, activityEvidence.takeaway) };
  }

  if (mechanism) {
    switch (mechanism.category) {
      case "SEQUENCING_REHEARSAL":
        if (rehearsalEngineFor(skill)?.kind === "chair-fly") return { kind: "chair-fly" };
        break;
      case "COMMUNICATION_PERFORMANCE":
        if (rehearsalEngineFor(skill)?.kind === "radio-practice") return { kind: "radio-practice", mode: "train" };
        break;
      case "UNDERSTANDING_KNOWLEDGE": {
        const explanation = skill !== "general" ? curatedTrainingGuidance(skill)?.checkQuestion?.explanation : null;
        return { kind: "coach", message: explanation ? `${mechanism.quote} ${explanation}` : mechanism.quote };
      }
    }
    return { kind: "transfer", objective: transferObjective(cfiName, mechanism.quote) };
  }

  if (rehearsalEngineFor(skill)?.kind === "radio-practice") {
    return { kind: "radio-practice", mode: "diagnose" };
  }
  const checkQuestion = skill !== "general" ? curatedTrainingGuidance(skill)?.checkQuestion : null;
  if (checkQuestion) {
    return { kind: "check", question: { prompt: checkQuestion.prompt } };
  }
  return { kind: "transfer", objective: transferObjective(cfiName, fallbackEvidenceText) };
}
