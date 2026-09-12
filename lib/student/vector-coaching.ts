import type { TrainingSkill } from "@/lib/types";
import { categoryForSkill, curatedTrainingGuidance, skillLabel } from "@/lib/topics";
import { hasAuthoredScenario } from "@/lib/prototype/chair-fly";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";
import type { ObservedMechanism } from "@/lib/student/observed-mechanism";

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
 */
export type ActivityEvidence =
  | { kind: "radio-practice"; correct: boolean; matchedElements: { description: string; matched: boolean }[] }
  | { kind: "check"; matchedConceptCount: number; expectedConceptCount: number; takeaway: string };

export type VectorStrategy =
  | { kind: "chair-fly" }
  | { kind: "radio-practice"; mode: "train" | "diagnose" }
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
 * its real, structured result, not from the skill or from mechanism.
 *   - Radio Practice: correct -> transfer (the scenario is handled,
 *     carry that confidence into the radio); not correct -> transfer
 *     framed by the specific required element the student actually
 *     missed (real, structured -- never a generic "try harder").
 *   - Vector's own Q&A: a solid answer (matched all expected concepts)
 *     legitimately re-opens Chair Fly for a skill that has one --
 *     understanding is now established, not assumed, so rehearsal is a
 *     grounded next step, not a capability-exists shortcut. Otherwise,
 *     transfer using the evaluator's own takeaway.
 *
 * ROUND 1, mechanism known (`mechanism` present, no activity has run yet):
 * the mechanism's category (lib/student/observed-mechanism.ts) -- derived
 * from real capability facts, never from the mechanism's own words --
 * decides the one appropriate move directly, no generic preliminary
 * question:
 *   - SEQUENCING_REHEARSAL -> Chair Fly.
 *   - COMMUNICATION_PERFORMANCE -> Radio Practice, framed as the
 *     rehearsal itself (mode: "train"), not a diagnostic.
 *   - UNDERSTANDING_KNOWLEDGE -> direct coaching from the quote plus
 *     curated explanation, no quiz.
 *   - Otherwise (no ground capability legitimately fits) -> transfer,
 *     objective built from the quote itself.
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
      const missed = activityEvidence.matchedElements.find((e) => !e.matched)?.description;
      return { kind: "transfer", objective: transferObjective(cfiName, missed ?? "the same call, on your next real radio contact") };
    }

    const solid = activityEvidence.expectedConceptCount > 0 && activityEvidence.matchedConceptCount >= activityEvidence.expectedConceptCount;
    if (solid && rehearsalEngineFor(skill)?.kind === "chair-fly") return { kind: "chair-fly" };
    return { kind: "transfer", objective: transferObjective(cfiName, activityEvidence.takeaway) };
  }

  if (mechanism) {
    switch (mechanism.category) {
      case "SEQUENCING_REHEARSAL":
        return { kind: "chair-fly" };
      case "COMMUNICATION_PERFORMANCE":
        return { kind: "radio-practice", mode: "train" };
      case "UNDERSTANDING_KNOWLEDGE": {
        const explanation = skill !== "general" ? curatedTrainingGuidance(skill)?.checkQuestion?.explanation : null;
        return { kind: "coach", message: explanation ? `${mechanism.quote} ${explanation}` : mechanism.quote };
      }
      default:
        return { kind: "transfer", objective: transferObjective(cfiName, mechanism.quote) };
    }
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
