import type { AssessmentDifference, TrainingSkill } from "@/lib/types";
import { citationForSkill, curatedTrainingGuidance } from "@/lib/topics";
import { isPhysicalSkill } from "@/lib/training-skill-kind";
import { hasAuthoredScenario } from "@/lib/prototype/chair-fly";

/**
 * Vector Train's deterministic router. Train has exactly one thing to
 * recommend (lib/training-memory.ts's computeRecommendedFocus) and this
 * module decides how the student can act on it: an existing real engine
 * (Chair Fly, Radio Practice) when one applies, otherwise grounded coaching
 * revealed inline. Nothing here calls an LLM -- every field is assembled
 * from curated TOPIC_LIBRARY content and fixed classification, so Vector
 * can never generate instructional text at request time. The student never
 * sees this distinction; there is only ever one button, "Train with
 * Vector," and this module decides what it does.
 */

const MAX_PREPARATION_POINTS = 4;
const MAX_COMMON_ERRORS = 3;

const PHYSICAL_SKILL_NOTE =
  "This is prep to bring into the aircraft with your instructor -- not a substitute for in-aircraft instruction.";

export interface VectorCoaching {
  /** Null when no TOPIC_LIBRARY entry matches the resolved skill at all -- the "no curated content yet" case, distinct from an entry that simply has no preparationPoints/commonErrors. */
  topic: string | null;
  /** 2-4 general, hedged preparation points -- never phrased as an observation of this specific student. Empty when nothing is curated yet. */
  preparationPoints: string[];
  /** 0-3 general "a common mistake is..." watch-outs -- same rule as preparationPoints. */
  commonErrors: string[];
  citation: { source: string; url: string } | null;
  /** Set only for a physical/stick-and-rudder skill with no interactive engine -- the framing sentence that stops this reveal from ever reading as "Vector can teach you to land." */
  physicalSkillNote: string | null;
}

export type VectorAction =
  | { kind: "chair-fly"; href: string; caption: string }
  | { kind: "radio-practice"; href: string };

export interface VectorSession {
  /** Always this literal string -- one consistent mental model, regardless of which branch below fired. The student never has to know the difference between a routed action and a coach-only reveal. */
  buttonLabel: "Train with Vector";
  /** Null means the button reveals coaching inline (student-train.tsx owns that local reveal state); non-null means it's a real link into an existing engine. */
  action: VectorAction | null;
  /** Null only when the resolved skill has no TOPIC_LIBRARY match at all -- the honest "nothing curated for this yet" case. Never fabricated to fill the gap. */
  coaching: VectorCoaching | null;
}

export function buildVectorSession(params: {
  resolvedSkill: TrainingSkill | null;
  contested: AssessmentDifference | null;
  hrefs: { chairFlyHref: string; radioPracticeHref?: string };
  nextLessonDay?: string | null;
}): VectorSession {
  const { resolvedSkill, contested, hrefs, nextLessonDay } = params;

  // Chair Fly outranks Radio Practice: an authored drill for the exact
  // contested objective is the most specific thing Vector can offer, the
  // same priority train-production-adapter.tsx used before this router
  // existed.
  if (contested && hasAuthoredScenario(contested.taskLabel)) {
    return {
      buttonLabel: "Train with Vector",
      action: {
        kind: "chair-fly",
        href: hrefs.chairFlyHref,
        caption: nextLessonDay ? `About 4 minutes · rehearse it before ${nextLessonDay}` : "About 4 minutes",
      },
      coaching: coachingFor(resolvedSkill, false),
    };
  }

  if (resolvedSkill === "RADIO_COMMUNICATIONS" && hrefs.radioPracticeHref) {
    return {
      buttonLabel: "Train with Vector",
      action: { kind: "radio-practice", href: hrefs.radioPracticeHref },
      coaching: coachingFor(resolvedSkill, false),
    };
  }

  // Neither existing engine applies -- Vector still isn't a dead end. The
  // button reveals grounded coaching inline instead of routing anywhere.
  return {
    buttonLabel: "Train with Vector",
    action: null,
    coaching: coachingFor(resolvedSkill, true),
  };
}

function coachingFor(skill: TrainingSkill | null, includePhysicalNote: boolean): VectorCoaching | null {
  if (!skill) return null;
  const curated = curatedTrainingGuidance(skill);
  const citation = curated?.citation ?? citationForSkill(skill);
  if (!curated && !citation) return null;
  return {
    topic: curated?.topic ?? null,
    preparationPoints: (curated?.preparationPoints ?? []).slice(0, MAX_PREPARATION_POINTS),
    commonErrors: (curated?.commonErrors ?? []).slice(0, MAX_COMMON_ERRORS),
    citation,
    physicalSkillNote: includePhysicalNote && isPhysicalSkill(skill) ? PHYSICAL_SKILL_NOTE : null,
  };
}
