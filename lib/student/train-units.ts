import type { Repository } from "@/lib/data/types";
import type { AssessmentDifference, InstructorGuidance, SkillProgressionStatus, TrainingItem, TrainingSignal, TrainingSkill } from "@/lib/types";
import { matchSkills, skillLabel as skillLabelFor } from "@/lib/topics";
import { computeSkillProgression } from "@/lib/skill-progress";
import { computeNextLessonBrief, STATUS_RANK } from "@/lib/training-memory";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatFlightDate } from "@/lib/utils";
import { buildVectorSession, type VectorSession } from "@/lib/student/vector-coaching";
import { collectInstructorQuoteCandidates, resolveEvidenceInterpretation, type InstructorQuoteCandidate, type ObservedMechanism } from "@/lib/student/observed-mechanism";

/**
 * A skill that is a more specific case of a broader one already in
 * TOPIC_LIBRARY -- e.g. a debrief sentence mentioning both "landing" and
 * "crosswind" resolves as CROSSWIND_LANDING, not the broader
 * STABILIZED_APPROACH, because the specific skill strictly implies the
 * general one and carries more actionable, more routable information (only
 * the specific skill has a matching authored Chair Fly scenario).
 *
 * Explicit and reviewed, deliberately not a length-of-keyword heuristic --
 * extend this table when a new specific/general pair is added to
 * TOPIC_LIBRARY, don't infer specificity algorithmically.
 */
const SKILL_GENERALIZES_TO: Partial<Record<TrainingSkill, TrainingSkill>> = {
  CROSSWIND_LANDING: "STABILIZED_APPROACH",
  SHORT_FIELD_LANDING: "STABILIZED_APPROACH",
  SOFT_FIELD_LANDING: "STABILIZED_APPROACH",
  FORWARD_SLIP: "STABILIZED_APPROACH",
  GO_AROUND: "STABILIZED_APPROACH",
  CROSSWIND_TAKEOFF: "NORMAL_TAKEOFF",
  SHORT_FIELD_TAKEOFF: "NORMAL_TAKEOFF",
  SOFT_FIELD_TAKEOFF: "NORMAL_TAKEOFF",
  POWER_OFF_STALLS: "STALLS",
  POWER_ON_STALLS: "STALLS",
  ACCELERATED_STALLS: "STALLS",
};

function narrowToMostSpecific(skills: TrainingSkill[]): TrainingSkill[] {
  const generalized = new Set(skills.map((s) => SKILL_GENERALIZES_TO[s]).filter((s): s is TrainingSkill => Boolean(s)));
  const narrowed = skills.filter((s) => !generalized.has(s));
  return narrowed.length > 0 ? narrowed : skills;
}

/**
 * Resolves one TrainingItem to a single TrainingSkill, strongest structured
 * evidence first -- never an LLM guess:
 *
 * 1. A FlightTask actually assigned/flown on this same flight, when its
 *    taskCode is among the candidates -- the CFI/student's own explicit
 *    label for what this flight covered.
 * 2. This exact sentence's own TrainingSignal rows -- classifyTrainingSignals
 *    already ran the same text match at analyze time against this identical
 *    string, so reusing it is free and unambiguous when it resolves to
 *    exactly one skill.
 * 3. matchSkills() directly, narrowed by SKILL_GENERALIZES_TO, as the
 *    deterministic text-matching fallback -- only reached when neither
 *    stronger source exists.
 *
 * Null when nothing resolves at all (no catalog skill matches the text) --
 * a real, honest answer: that item simply can't become a routable Vector
 * training unit.
 */
export function resolveTrainingItemSkill(
  item: TrainingItem,
  signals: TrainingSignal[],
  flightTaskCodes: ReadonlySet<string>,
): TrainingSkill | null {
  const fromSignals = signals
    .filter((s) => s.debriefId === item.debriefId && s.statement === item.description)
    .map((s) => s.skill);
  const candidates = fromSignals.length > 0 ? fromSignals : matchSkills(item.description).map((m) => m.skill);
  if (candidates.length === 0) return null;

  const taskMatch = candidates.find((s) => flightTaskCodes.has(s));
  if (taskMatch) return taskMatch;

  const narrowed = narrowToMostSpecific(candidates);
  return narrowed[0] ?? candidates[0]!;
}

/**
 * Looks up one TrainingItem by id, scoped to this student's own flights at
 * the query itself (listTrainingItems({studentId}) JOINs against
 * flights.student_id -- see lib/data/postgres-repository.ts), and resolves
 * its skill. Null whenever the id doesn't exist, doesn't belong to this
 * student, isn't a student-visible "keep_working_on" unit, or resolves to
 * no catalog skill at all -- possession of an id is never sufficient
 * authorization on its own, and every caller (the session page, the
 * evaluate endpoint, the Radio Practice assign route, the Chair Fly
 * hand-off) needs the exact same check.
 *
 * Deliberately does NOT resolve evidence interpretation (instructor quote /
 * observed mechanism) here -- that costs a real model call
 * (lib/ai/evidence-mechanism.ts), and most callers of this function (the
 * evaluate route, the Radio Practice assign route) only need ownership and
 * skill, never mechanism. Callers that do need it call
 * resolveTrainingUnitEvidence below, once, with the debrief they already
 * have in hand.
 */
export async function resolveOwnedTrainingItem(
  repo: Repository,
  studentId: string,
  itemId: string,
): Promise<{ item: TrainingItem; skill: TrainingSkill } | null> {
  const items = await repo.listTrainingItems({ studentId });
  const item = items.find((t) => t.id === itemId);
  if (!item || item.category !== "keep_working_on" || item.visibility === "instructor_only" || item.visibility === "admin_only") {
    return null;
  }

  const [signals, flightTasks] = await Promise.all([
    repo.listTrainingSignals({ studentId }),
    repo.listFlightTasks(item.flightId),
  ]);
  const skill = resolveTrainingItemSkill(item, signals, new Set(flightTasks.map((t) => t.taskCode)));
  return skill ? { item, skill } : null;
}

/**
 * The one shared path to a training unit's real evidence interpretation --
 * used by both Train's card list (buildTrainingPlan) and the Vector session
 * adapter, so the two can never disagree about the same unit. Assembles
 * every real candidate instructor quote (collectInstructorQuoteCandidates)
 * and hands them to the bounded extractor
 * (lib/student/observed-mechanism.ts's resolveEvidenceInterpretation).
 */
export async function resolveTrainingUnitEvidence(
  assessmentDifferences: AssessmentDifference[],
  instructorGuidance: InstructorGuidance[],
  skill: TrainingSkill,
  skillLabel: string,
  cfiName: string,
): Promise<{ instructorQuote: InstructorQuoteCandidate | null; mechanism: ObservedMechanism | null }> {
  const candidates = collectInstructorQuoteCandidates(assessmentDifferences, instructorGuidance, skill, cfiName);
  const interpretation = await resolveEvidenceInterpretation(candidates, skillLabel);
  return {
    instructorQuote: interpretation?.instructorQuote ?? null,
    mechanism: interpretation?.observedMechanism ?? null,
  };
}

export interface TrainingUnit {
  /** The backing TrainingItem's own stable id -- this unit's identity for routing and server-side ownership checks. */
  id: string;
  flightId: string;
  debriefId: string;
  skill: TrainingSkill;
  skillLabel: string;
  evidence: { label: string; text: string };
  /** The one real instructor quote judged relevant to this unit, if any -- valuable evidence in its own right, distinct from observedMechanism (a quote can be relevant without stating a mechanism). */
  instructorQuote: InstructorQuoteCandidate | null;
  /** Only non-null when that same quote explicitly states a concrete mechanism -- see lib/student/observed-mechanism.ts. Never fabricated from the skill code or from a general topic-naming comment. */
  mechanism: ObservedMechanism | null;
  /** Null when this skill has no prior progression row at all -- this debrief is its first appearance. */
  progressionStatus: SkillProgressionStatus | null;
  vectorSession: VectorSession;
}

export interface TrainingPlan {
  /** Vector's own pick of where to start, using the same urgency ranking Next Flight/Progress already use. Null only when the last debrief produced no routable unit at all. */
  startHere: TrainingUnit | null;
  /** Up to 2 more, immediately visible. */
  alsoTrain: TrainingUnit[];
  /** Valid, distinct, current-debrief units beyond the visible cap -- never silently dropped, always reachable via progressive disclosure. */
  more: TrainingUnit[];
}

const VISIBLE_CAP = 3;

/**
 * The latest completed debrief's quality-filtered Needs Work items, each
 * resolved to one Vector training unit -- the canonical replacement for a
 * single global "recommended focus." Sourced from
 * computeNextLessonBrief's own keepWorkingOnTrainingItems (already the same
 * filterTrainingItemDescriptions-gated, stable-id rows Next Flight shows),
 * never a second independent read of raw AI text.
 *
 * Two items that resolve to the same skill collapse into one unit (first
 * occurrence wins) -- the product model is one card per distinct training
 * need, not one card per sentence.
 */
export async function buildTrainingPlan(repo: Repository, studentId: string): Promise<TrainingPlan> {
  const brief = await computeNextLessonBrief(repo, studentId);
  const items = brief.keepWorkingOnTrainingItems;
  if (!brief.lastFlight || items.length === 0) {
    return { startHere: null, alsoTrain: [], more: [] };
  }

  const [signals, flightTasks] = await Promise.all([
    repo.listTrainingSignals({ studentId }),
    repo.listFlightTasks(brief.lastFlight.id),
  ]);
  const flightTaskCodes = new Set(flightTasks.map((t) => t.taskCode));
  const cfi = resolveCfiFirstName(brief.lastInstructor);
  const evidenceLabel = `${cfi ?? "Your instructor"} · ${formatFlightDate(brief.lastFlight.flightDate)}`;

  const bySkill = new Map<TrainingSkill, TrainingItem>();
  for (const item of items) {
    const skill = resolveTrainingItemSkill(item, signals, flightTaskCodes);
    if (!skill || bySkill.has(skill)) continue;
    bySkill.set(skill, item);
  }

  const progressions = computeSkillProgression(signals.filter((s) => !s.dismissed));
  function rankFor(skill: TrainingSkill): number {
    const progression = progressions.find((p) => p.skill === skill);
    // No prior progression row at all means this debrief is the first time
    // it came up -- still this debrief's own words, so it's ranked exactly
    // as urgent as "Needs Coaching," never silently deprioritized.
    return progression ? STATUS_RANK[progression.status] : STATUS_RANK["Needs Coaching"];
  }

  // Read-only: instructorQuote/observedMechanism were already computed once,
  // when this TrainingItem was created (app/api/debrief/analyze/route.ts),
  // and persisted onto the row itself. Train never recomputes them -- doing
  // so here would mean this exact same item could disagree with what the
  // Vector session (lib/student/vector-session-adapter.ts) shows for it,
  // since each would be an independent model call.
  const units: TrainingUnit[] = [...bySkill.entries()].map(([skill, item]) => ({
    id: item.id,
    flightId: item.flightId,
    debriefId: item.debriefId,
    skill,
    skillLabel: skillLabelFor(skill),
    evidence: { label: evidenceLabel, text: item.description },
    instructorQuote: item.instructorQuote,
    mechanism: item.observedMechanism,
    progressionStatus: progressions.find((p) => p.skill === skill)?.status ?? null,
    vectorSession: buildVectorSession(item.id),
  }));

  units.sort((a, b) => rankFor(a.skill) - rankFor(b.skill));

  return {
    startHere: units[0] ?? null,
    alsoTrain: units.slice(1, VISIBLE_CAP),
    more: units.slice(VISIBLE_CAP),
  };
}
