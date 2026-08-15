import type { PerformanceLevelCode } from "@/lib/performance-levels";
import type { CardCategory, CardDefinition, DebriefCardSource, DiscrepancyStatus, FlightTask } from "@/lib/types";
import { discrepancyDistance, discrepancyStatusFor } from "./discrepancy";

const MAX_CARDS = 8;
const RISK_TASK_CODES = new Set(["RISK_MANAGEMENT", "SITUATIONAL_AWARENESS"]);

export interface RecentSkillHistoryEntry {
  taskCode: string;
  /** How many of the last `consideredFlights` flights flagged this task (rated Needs Coaching/Learning, or flagged for follow-up). */
  flaggedCount: number;
  consideredFlights: number;
}

export interface GenerateCardsInput {
  flightTasks: FlightTask[];
  /** Keyed by taskCode. */
  studentRatings: Map<string, PerformanceLevelCode>;
  instructorRatings: Map<string, PerformanceLevelCode>;
  /** Resolved for the flight's org (global defaults + any org overrides already merged -- see Repository.listCardDefinitions). */
  cardDefinitions: CardDefinition[];
  recentSkillHistory: RecentSkillHistoryEntry[];
  lessonObjectiveTaskCode?: string | null;
}

/** What generateDebriefCards returns -- the caller (an API route) adds flightId/id/createdAt when persisting via Repository.createCards. */
export interface DebriefCardDraft {
  cardDefinitionId: string | null;
  flightTaskId: string | null;
  source: DebriefCardSource;
  category: CardCategory;
  title: string;
  primaryPrompt: string;
  followUpPrompts: string[];
  acsArea: string | null;
  acsAreaUrl: string | null;
  studentRating: PerformanceLevelCode | null;
  instructorRating: PerformanceLevelCode | null;
  discrepancyStatus: DiscrepancyStatus;
  sortOrder: number;
  status: "pending";
  flaggedForFollowUp: false;
  recordingStartSeconds: null;
  recordingEndSeconds: null;
}

function findDef(defs: CardDefinition[], code: string): CardDefinition | undefined {
  return defs.find((d) => d.code === code);
}

function baseDraft(
  def: CardDefinition | undefined,
  overrides: Partial<DebriefCardDraft> & Pick<DebriefCardDraft, "source" | "sortOrder">,
): DebriefCardDraft {
  return {
    cardDefinitionId: def?.id ?? null,
    flightTaskId: null,
    category: def?.category ?? "CUSTOM",
    title: def?.title ?? "Discussion",
    primaryPrompt: def?.primaryPrompt ?? "",
    followUpPrompts: def?.followUpPrompts ?? [],
    acsArea: null,
    acsAreaUrl: null,
    studentRating: null,
    instructorRating: null,
    discrepancyStatus: "none",
    status: "pending",
    flaggedForFollowUp: false,
    recordingStartSeconds: null,
    recordingEndSeconds: null,
    ...overrides,
  };
}

/**
 * Pure function, no DB access -- generates the ordered, capped card list for
 * one flight's guided debrief. Runs server-side the moment the instructor's
 * assessment is submitted (see app/api/flights/[id]/debrief/assessments/[role]/submit
 * route). Tiering mirrors the debrief-redesign plan's priority order exactly:
 * fixed anchors, then discrepancies, agreed-weak-spots, risk elevation,
 * recurring issues, the lesson objective, improvements, and next-flight prep
 * -- capped at MAX_CARDS so a flight never produces a 20-question survey.
 */
export function generateDebriefCards(input: GenerateCardsInput): DebriefCardDraft[] {
  const { flightTasks, studentRatings, instructorRatings, cardDefinitions, recentSkillHistory, lessonObjectiveTaskCode } = input;

  const taskByCode = new Map<string, FlightTask>(flightTasks.map((t) => [t.taskCode, t]));
  const historyByCode = new Map(recentSkillHistory.map((h) => [h.taskCode, h]));
  const usedTaskCodes = new Set<string>();

  // Anchors always included, regardless of ratings.
  const objectiveDef = findDef(cardDefinitions, "objective");
  const riskDef = findDef(cardDefinitions, "risk_management");
  const nextFlightDef = findDef(cardDefinitions, "next_flight");

  const anchors: DebriefCardDraft[] = [];

  if (lessonObjectiveTaskCode && taskByCode.has(lessonObjectiveTaskCode)) {
    const task = taskByCode.get(lessonObjectiveTaskCode)!;
    anchors.push(
      baseDraft(objectiveDef, {
        source: "standard",
        sortOrder: 0,
        flightTaskId: task.id,
        primaryPrompt: `What were we working on today? (Today's focus: ${task.label}.)`,
      }),
    );
    usedTaskCodes.add(lessonObjectiveTaskCode);
  } else {
    anchors.push(baseDraft(objectiveDef, { source: "standard", sortOrder: 0 }));
  }

  // Risk/ADM anchor: elevated with a specific sub-topic if a risk-related task
  // was rated Needs Coaching/Learning by either rater -- never phrased as
  // "something unsafe happened," just a more specific discussion prompt.
  let riskPrompt = riskDef?.primaryPrompt ?? "Was there a decision today that's worth talking about?";
  let riskFlightTaskId: string | null = null;
  for (const taskCode of RISK_TASK_CODES) {
    const task = taskByCode.get(taskCode);
    if (!task) continue;
    const student = studentRatings.get(taskCode);
    const instructor = instructorRatings.get(taskCode);
    const weak = student === "NEEDS_COACHING" || student === "LEARNING" || instructor === "NEEDS_COACHING" || instructor === "LEARNING";
    if (weak) {
      riskPrompt = `Was there a decision today that's worth talking about, especially around ${task.label.toLowerCase()}?`;
      riskFlightTaskId = task.id;
      usedTaskCodes.add(taskCode);
      break;
    }
  }
  anchors.push(
    baseDraft(riskDef, { source: "standard", sortOrder: 1, primaryPrompt: riskPrompt, flightTaskId: riskFlightTaskId }),
  );

  anchors.push(baseDraft(nextFlightDef, { source: "standard", sortOrder: MAX_CARDS - 1 }));

  // Candidate pool, in tier order -- discrepancies, agreed weak spots,
  // previous-flight issues, the lesson objective (if not already an anchor),
  // improvements. Each candidate is skipped if its task was already used by
  // a higher tier (a task never gets two cards).
  const candidates: DebriefCardDraft[] = [];
  let sortCursor = 2;

  const ratedTaskCodes = new Set([...studentRatings.keys(), ...instructorRatings.keys()]);
  const discrepancies: { taskCode: string; distance: number }[] = [];
  for (const taskCode of ratedTaskCodes) {
    const student = studentRatings.get(taskCode);
    const instructor = instructorRatings.get(taskCode);
    if (!student || !instructor) continue;
    const distance = discrepancyDistance(student, instructor);
    if (distance > 0) discrepancies.push({ taskCode, distance });
  }
  discrepancies.sort((a, b) => b.distance - a.distance); // significant first

  for (const { taskCode, distance } of discrepancies) {
    if (usedTaskCodes.has(taskCode)) continue;
    const task = taskByCode.get(taskCode);
    if (!task) continue;
    usedTaskCodes.add(taskCode);
    candidates.push(
      baseDraft(undefined, {
        source: "assessment_discrepancy",
        category: "DISCREPANCY",
        sortOrder: sortCursor++,
        title: task.label,
        primaryPrompt: "You saw this differently -- what did each of you see?",
        followUpPrompts: ["Where did the instructor still need to provide help or correction?"],
        flightTaskId: task.id,
        studentRating: studentRatings.get(taskCode) ?? null,
        instructorRating: instructorRatings.get(taskCode) ?? null,
        discrepancyStatus: discrepancyStatusFor(distance),
      }),
    );
  }

  // Tasks both raters agree are weak -- a straightforward "what needs work" card.
  for (const taskCode of ratedTaskCodes) {
    if (usedTaskCodes.has(taskCode)) continue;
    const student = studentRatings.get(taskCode);
    const instructor = instructorRatings.get(taskCode);
    const bothWeak = (student === "NEEDS_COACHING" || student === "LEARNING") && (instructor === "NEEDS_COACHING" || instructor === "LEARNING");
    if (!bothWeak) continue;
    const task = taskByCode.get(taskCode);
    if (!task) continue;
    usedTaskCodes.add(taskCode);
    candidates.push(
      baseDraft(findDef(cardDefinitions, "key_training_task"), {
        source: "standard",
        sortOrder: sortCursor++,
        title: task.label,
        flightTaskId: task.id,
        studentRating: student ?? null,
        instructorRating: instructor ?? null,
      }),
    );
  }

  // Previous-flight issues: tasks flagged in >=2 of the last 3 considered flights,
  // unless both raters now say Independent -- that's resolved, and belongs to the
  // celebratory "meaningful improvements" tier below instead.
  for (const [taskCode, history] of historyByCode) {
    if (usedTaskCodes.has(taskCode)) continue;
    if (history.flaggedCount < 2) continue;
    const student = studentRatings.get(taskCode);
    const instructor = instructorRatings.get(taskCode);
    if (student === "INDEPENDENT" && instructor === "INDEPENDENT") continue;
    const task = taskByCode.get(taskCode);
    if (!task) continue;
    usedTaskCodes.add(taskCode);
    candidates.push(
      baseDraft(undefined, {
        source: "previous_flight_issue",
        category: "IMPROVEMENT",
        sortOrder: sortCursor++,
        title: task.label,
        primaryPrompt: `This has come up in ${history.flaggedCount} of your last ${history.consideredFlights} flights -- how did it go today?`,
        flightTaskId: task.id,
        studentRating: studentRatings.get(taskCode) ?? null,
        instructorRating: instructorRatings.get(taskCode) ?? null,
      }),
    );
  }

  // The flight's primary lesson objective, if it wasn't already folded into
  // the Objective anchor and isn't otherwise covered.
  if (lessonObjectiveTaskCode && !usedTaskCodes.has(lessonObjectiveTaskCode)) {
    const task = taskByCode.get(lessonObjectiveTaskCode);
    if (task) {
      usedTaskCodes.add(lessonObjectiveTaskCode);
      candidates.push(
        baseDraft(findDef(cardDefinitions, "key_training_task"), {
          source: "standard",
          sortOrder: sortCursor++,
          title: task.label,
          flightTaskId: task.id,
          studentRating: studentRatings.get(lessonObjectiveTaskCode) ?? null,
          instructorRating: instructorRatings.get(lessonObjectiveTaskCode) ?? null,
        }),
      );
    }
  }

  // Meaningful improvements: both raters now say Independent, but history
  // shows this task was flagged before -- brief, celebratory.
  for (const taskCode of ratedTaskCodes) {
    if (usedTaskCodes.has(taskCode)) continue;
    const student = studentRatings.get(taskCode);
    const instructor = instructorRatings.get(taskCode);
    const bothIndependent = student === "INDEPENDENT" && instructor === "INDEPENDENT";
    const history = historyByCode.get(taskCode);
    if (!bothIndependent || !history || history.flaggedCount === 0) continue;
    const task = taskByCode.get(taskCode);
    if (!task) continue;
    usedTaskCodes.add(taskCode);
    candidates.push(
      baseDraft(undefined, {
        source: "standard",
        category: "STRENGTHS",
        sortOrder: sortCursor++,
        title: task.label,
        primaryPrompt: `You've been working on ${task.label.toLowerCase()} -- today it clicked. What felt different?`,
        flightTaskId: task.id,
        studentRating: student,
        instructorRating: instructor,
      }),
    );
  }

  // Cap: 3 anchors + up to (MAX_CARDS - 3) more by tier order.
  const selected = candidates.slice(0, MAX_CARDS - anchors.length);

  // Tasks both rated Independent with no history flag never got a dedicated
  // card above -- fold them into one lightweight mention rather than
  // dropping them silently, if there's room and any exist.
  const quietlyGood = flightTasks
    .map((t) => t.taskCode)
    .filter((code) => !usedTaskCodes.has(code))
    .filter((code) => {
      const student = studentRatings.get(code);
      const instructor = instructorRatings.get(code);
      return student === "INDEPENDENT" && instructor === "INDEPENDENT";
    });
  if (quietlyGood.length > 0 && selected.length < MAX_CARDS - anchors.length) {
    const labels = quietlyGood.map((code) => taskByCode.get(code)?.label).filter((l): l is string => !!l);
    selected.push(
      baseDraft(undefined, {
        source: "standard",
        category: "STRENGTHS",
        sortOrder: sortCursor++,
        title: "Also looking solid",
        primaryPrompt: `${labels.join(", ")} -- worth a quick mention, but no deep dive needed.`,
      }),
    );
  }

  // Anchors first two (Objective, Risk/ADM), then the tiered selection, then
  // Next Flight last -- re-assign sortOrder to a clean 0..n sequence.
  const ordered = [anchors[0], anchors[1], ...selected, anchors[2]];
  return ordered.map((c, i) => ({ ...c, sortOrder: i }));
}
