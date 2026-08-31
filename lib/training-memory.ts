import { skillLabel } from "@/lib/topics";
import { debriefStageLabel } from "@/lib/debrief-progress";
import type { DebriefProgress } from "@/lib/debrief-progress";
import type { Repository } from "@/lib/data/types";
import type {
  Debrief,
  DebriefStatus,
  FlightWithRelations,
  Instructor,
  InstructorGuidance,
  Reservation,
  TrainingItem,
  TrainingSignal,
  TrainingSkill,
  User,
} from "@/lib/types";

export interface RecurringTheme {
  theme: string;
  skill: TrainingSkill;
  count: number;
  consideredFlights: number;
  /**
   * How many DISTINCT instructors were on the flights where this came up.
   *
   * This is the whole point of the field: a weakness that survives two
   * different instructors is evidence about the SKILL, not about either
   * instructor. One CFI seeing it three times could be a teaching style; two
   * CFIs seeing it three times is the thing itself persisting.
   *
   * Deliberately a count and never a per-instructor breakdown. A rollup keyed
   * by instructor is a CFI scorecard, and a CFI who believes the tool grades
   * them stops talking into it -- which ends the capture the entire product
   * depends on. Instructor names appear in `lessons` below as neutral
   * timeline context only.
   */
  instructorCount: number;
  /** Flights where this surfaced, oldest first -- the timeline, not a ranking. */
  lessons: RecurringThemeLesson[];
}

export interface RecurringThemeLesson {
  flightId: string;
  flightDate: string;
  /** Context marker, never a subject of evaluation. Null when no CFI was recorded (solo). */
  instructorName: string | null;
  /** The debrief sentence that produced the signal -- grounds the claim instead of asserting it. */
  statement: string;
}

/**
 * Computed (not stored) forward-looking brief for a student -- one function
 * powers the student's own Next-Lesson Brief, a CFI's Handoff Brief for that
 * student, and the "Next Lesson" section of a student's training profile.
 * Persisting a CFI-editable version of this is a natural fast-follow once
 * that editing UI is wanted; for now it's always derived fresh from history.
 */
export interface NextLessonBrief {
  studentId: string;
  lastFlight: FlightWithRelations | null;
  lastDebrief: Debrief | null;
  lastInstructor: Instructor | null;
  /** The single most recent instructor quote actually captured in a debrief -- never fabricated. */
  lastInstructorNote: InstructorGuidance | null;
  /** Positive reminders from the last debrief -- capped short, for a "Last Time" briefing beat, not a full recap. */
  lastWentWell: string[];
  focusAreas: string[];
  keepWorkingOn: string[];
  beforeFlightItems: string[];
  /** Same items as keepWorkingOn/beforeFlightItems, as live rows with ids -- lets the student's own Next-Lesson page render a checkable self-affirmation list, and lets a CFI's handoff brief render an editable one, instead of static bullets. */
  keepWorkingOnTrainingItems: TrainingItem[];
  beforeFlightTrainingItems: TrainingItem[];
  recurringThemes: RecurringTheme[];
  upcomingReservation: Reservation | null;
  upcomingReservationInstructor: User | null;
  /** Deterministic, not LLM-generated -- templated from the top focus/action item so there's always a concrete, grounded prompt to hand the student, never an invented one. */
  suggestedQuestion: string | null;
}

/**
 * How many completed flights the recurrence analysis looks back over.
 * Wider than the brief's "last few lessons" framing because cross-instructor
 * persistence is only visible across an instructor change.
 */
const RECURRENCE_LOOKBACK_FLIGHTS = 8;

export async function computeNextLessonBrief(repo: Repository, studentId: string): Promise<NextLessonBrief> {
  const [flights, trainingItems, reservations] = await Promise.all([
    repo.listFlights({ studentId }),
    repo.listTrainingItems(),
    repo.listReservations({ studentId }),
  ]);

  const completed = [...flights]
    .filter((f) => f.debriefStatus === "complete")
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate));
  const lastFlight = completed[0] ?? null;
  const lastDebrief = lastFlight ? await repo.getDebriefByFlight(lastFlight.id) : null;

  const itemsForLastFlight = lastFlight
    ? trainingItems.filter((t) => t.flightId === lastFlight.id && !t.done && t.visibility !== "instructor_only" && t.visibility !== "admin_only")
    : [];
  const keepWorkingOnTrainingItems = itemsForLastFlight.filter((t) => t.category === "keep_working_on");
  const keepWorkingOn = keepWorkingOnTrainingItems.map((t) => t.description);
  const beforeFlightTrainingItems = itemsForLastFlight.filter((t) => t.category === "before_next_flight");
  const beforeFlightItems = beforeFlightTrainingItems.map((t) => t.description);
  const focusAreas = lastDebrief?.structuredResult.nextLessonFocus ?? [];

  const lastInstructor = lastFlight?.instructor ?? null;
  const lastInstructorNote = lastDebrief?.structuredResult.instructorGuidance[0] ?? null;
  const lastWentWell = lastDebrief?.structuredResult.wentWell.slice(0, 3) ?? [];
  const suggestedQuestion = buildSuggestedQuestion(focusAreas, keepWorkingOn);

  // Recurrence looks back further than the rest of this brief on purpose.
  // A weakness only proves it crossed instructors if the window is wide
  // enough to CONTAIN two instructors, and a student who changed CFIs three
  // lessons ago would show a single-instructor pattern under a 4-flight
  // window -- hiding the exact thing this analysis exists to find.
  const recentCompleted = completed.slice(0, RECURRENCE_LOOKBACK_FLIGHTS);
  const recentFlightIds = new Set(recentCompleted.map((f) => f.id));
  const signals = await repo.listTrainingSignals({ studentId });
  const recentSignals = signals.filter((s) => recentFlightIds.has(s.flightId) && !s.dismissed);
  // Names come from the flights themselves rather than a second round of user
  // lookups; every signal in the window belongs to one of these flights.
  const instructorNamesById = new Map<string, string>();
  for (const f of recentCompleted) {
    if (f.instructor) instructorNamesById.set(f.instructor.id, f.instructor.name);
  }
  const recurringThemes = computeRecurringThemes(recentSignals, recentCompleted.length, instructorNamesById);

  const now = Date.now();
  const upcomingReservation =
    reservations
      .filter((r) => r.status === "scheduled" && new Date(r.scheduledStart).getTime() >= now)
      .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart))[0] ?? null;
  // The reservation's own instructor, NOT lastInstructor -- a rescheduled or
  // reassigned flight can easily have a different CFI than the last debrief,
  // and conflating the two showed the wrong instructor name on the student's
  // Next Flight card.
  const upcomingReservationInstructor = upcomingReservation ? await repo.getUser(upcomingReservation.instructorId) : null;

  return {
    studentId,
    lastFlight,
    lastDebrief,
    lastInstructor,
    lastInstructorNote,
    lastWentWell,
    focusAreas,
    keepWorkingOn,
    beforeFlightItems,
    keepWorkingOnTrainingItems,
    beforeFlightTrainingItems,
    recurringThemes,
    upcomingReservation,
    upcomingReservationInstructor,
    suggestedQuestion,
  };
}

/**
 * Templated, not generated -- the app already has the top thing worth
 * discussing (the last debrief's own focus item), so asking an LLM to
 * paraphrase it would just risk drifting from what was actually said.
 */
export function buildSuggestedQuestion(focusAreas: string[], keepWorkingOn: string[]): string | null {
  const topItem = focusAreas[0] ?? keepWorkingOn[0];
  if (!topItem) return null;
  const lowered = topItem[0].toLowerCase() + topItem.slice(1);
  return `Can we spend a few extra minutes on ${lowered} today?`;
}

/**
 * Conservative by design: a theme only surfaces once the same skill shows
 * NEEDS_COACHING in at least 2 of the considered flights. With fewer than 2
 * flights total there's nothing to call "recurring" yet. Reads normalized
 * TrainingSignal rows (classified once at debrief time, see lib/taxonomy.ts)
 * instead of re-parsing free text on every render.
 */
/** Exported for tests -- the cross-instructor count is the load-bearing claim in the product. */
export function computeRecurringThemes(
  signals: TrainingSignal[],
  consideredFlights: number,
  instructorNamesById: Map<string, string> = new Map(),
): RecurringTheme[] {
  if (consideredFlights < 2) return [];

  // Keyed by flight, not by signal: one debrief can emit several signals for
  // the same skill, and counting those as separate occurrences would report
  // "came up in 4 lessons" from a single talkative debrief.
  const bySkill = new Map<string, Map<string, TrainingSignal>>();
  for (const signal of signals) {
    if (signal.status !== "NEEDS_COACHING") continue;
    if (!bySkill.has(signal.skill)) bySkill.set(signal.skill, new Map());
    const flights = bySkill.get(signal.skill)!;
    if (!flights.has(signal.flightId)) flights.set(signal.flightId, signal);
  }

  return Array.from(bySkill.entries())
    .map(([skill, flights]) => {
      const lessons = Array.from(flights.values())
        .sort((a, b) => a.flightDate.localeCompare(b.flightDate))
        .map((s) => ({
          flightId: s.flightId,
          flightDate: s.flightDate,
          instructorName: s.instructorId ? (instructorNamesById.get(s.instructorId) ?? null) : null,
          statement: s.statement,
        }));
      // Distinct NAMED instructors. A solo flight contributes no instructor
      // rather than counting as an anonymous extra one, which would inflate
      // the number that carries the entire claim.
      const instructorCount = new Set(
        Array.from(flights.values())
          .map((s) => s.instructorId)
          .filter((id): id is string => Boolean(id)),
      ).size;
      return {
        theme: skillLabel(skill as TrainingSignal["skill"]),
        skill: skill as TrainingSkill,
        count: flights.size,
        consideredFlights,
        instructorCount,
        lessons,
      };
    })
    .filter((t) => t.count >= 2)
    // Themes that crossed instructors first: those are the ones a brief
    // exists to surface, because nobody in the chain could have seen them.
    .sort((a, b) => b.instructorCount - a.instructorCount || b.count - a.count);
}

/**
 * The one sentence this analysis exists to produce.
 *
 * Phrased so the subject is always the skill. "has come up in 3 lessons with
 * 2 instructors" states persistence; it does not say anyone failed to fix it,
 * and the copy must never drift in that direction -- see RecurringTheme.
 */
export function recurringThemeSummary(theme: RecurringTheme): string {
  const lessons = `${theme.count} lesson${theme.count === 1 ? "" : "s"}`;
  if (theme.instructorCount >= 2) {
    return `${theme.theme} has come up in ${lessons} with ${theme.instructorCount} instructors.`;
  }
  return `${theme.theme} has come up in ${lessons}.`;
}

/**
 * A concrete first move for the next lesson, so the brief ends with an action
 * rather than a reading list.
 *
 * Deterministic and templated on purpose -- this is the one line most likely
 * to be read aloud or acted on directly, and a model-generated suggestion
 * could invent a maneuver the student has never flown. It only ever
 * recombines what the last debrief and the recurrence analysis already said.
 */
export function recommendedStartingPoint(brief: NextLessonBrief): string | null {
  const recurring = brief.recurringThemes[0];
  const focus = brief.focusAreas[0];
  if (recurring) {
    const theme = recurring.theme.toLowerCase();
    return focus
      ? `Start with one normal pattern to warm up, then go straight at ${theme} -- it's the thing that keeps coming back. Work ${focus.toLowerCase()} into the same session.`
      : `Start with one normal pattern to warm up, then go straight at ${theme} -- it's the thing that keeps coming back.`;
  }
  if (focus) return `Pick up where the last lesson left off: ${focus.toLowerCase()}.`;
  return null;
}

// --- CFI roster ------------------------------------------------------------

export interface StudentRosterEntry {
  student: User;
  status: "active" | "inactive";
  isPrimary: boolean;
  mostRecentFlight: FlightWithRelations | null;
  /**
   * The most recent flight that ISN'T debriefed yet, independent of
   * mostRecentFlight -- a CFI backfilling an older flight (e.g. real FR24
   * data logged after the fact) means the newest flight by date can easily
   * already be complete while an older one still sits mid-debrief. Without
   * this split, attentionReasons() below silently loses track of any pending
   * flight that isn't also the newest one.
   */
  pendingFlight: FlightWithRelations | null;
  lastDebriefStatus: DebriefStatus | null;
  nextReservation: Reservation | null;
  currentFocus: string[];
  /** Whether there's anything in Keep Working On / Before Next Flight -- these are auto-drafted from the transcript and reviewed by the CFI on /review, so this is only false for a debrief thin enough that nothing came out of it. */
  hasNextLessonItems: boolean;
}

export async function computeInstructorRoster(
  repo: Repository,
  instructorId: string,
  organizationId: string,
): Promise<StudentRosterEntry[]> {
  const links = await repo.listStudentLinksForInstructor(instructorId, organizationId);

  const entries = await Promise.all(
    links.map(async (link): Promise<StudentRosterEntry | null> => {
      const student = await repo.getUser(link.studentId);
      if (!student) return null;

      const [flights, reservations, brief] = await Promise.all([
        repo.listFlights({ studentId: link.studentId }),
        repo.listReservations({ studentId: link.studentId }),
        computeNextLessonBrief(repo, link.studentId),
      ]);

      const mostRecentFlight = [...flights].sort((a, b) => b.flightDate.localeCompare(a.flightDate))[0] ?? null;
      const pendingFlight =
        [...flights]
          .filter((f) => f.debriefStatus !== "complete")
          .sort((a, b) => b.flightDate.localeCompare(a.flightDate))[0] ?? null;
      const now = Date.now();
      const nextReservation =
        reservations
          .filter((r) => r.status === "scheduled" && new Date(r.scheduledStart).getTime() >= now)
          .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart))[0] ?? null;

      return {
        student,
        status: link.status,
        isPrimary: link.isPrimary,
        mostRecentFlight,
        pendingFlight,
        lastDebriefStatus: mostRecentFlight?.debriefStatus ?? null,
        nextReservation,
        currentFocus: brief.focusAreas,
        hasNextLessonItems: brief.keepWorkingOnTrainingItems.length > 0 || brief.beforeFlightTrainingItems.length > 0,
      };
    }),
  );

  return entries.filter((e): e is StudentRosterEntry => e !== null);
}

/**
 * Short, human-readable reasons a student needs a CFI's attention -- kept
 * restrained on purpose. `progress`, when supplied, replaces the generic
 * "Debrief not completed" with the actual stage (see
 * lib/debrief-progress.ts) -- optional so callers that haven't computed it
 * (cheaper, no extra queries) still get a reasonable fallback.
 */
export function attentionReasons(entry: StudentRosterEntry, progress?: DebriefProgress): string[] {
  const reasons: string[] = [];
  if (entry.pendingFlight) {
    reasons.push(progress ? debriefStageLabel(progress) : "Debrief not completed");
  }
  if (!entry.pendingFlight && entry.mostRecentFlight?.debriefStatus === "complete") {
    if (!entry.hasNextLessonItems) {
      reasons.push("Next lesson has no objectives");
    }
    if (!entry.nextReservation) {
      reasons.push("No flight scheduled");
    }
  }
  if (!entry.mostRecentFlight) {
    reasons.push("No recent training activity");
  }
  return reasons;
}
