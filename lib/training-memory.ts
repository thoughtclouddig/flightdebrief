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
  TrainingSignal,
  TrainingSkill,
  User,
} from "@/lib/types";

export interface RecurringTheme {
  theme: string;
  skill: TrainingSkill;
  count: number;
  consideredFlights: number;
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
  recurringThemes: RecurringTheme[];
  upcomingReservation: Reservation | null;
  /** Deterministic, not LLM-generated -- templated from the top focus/action item so there's always a concrete, grounded prompt to hand the student, never an invented one. */
  suggestedQuestion: string | null;
}

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
  const keepWorkingOn = itemsForLastFlight.filter((t) => t.category === "keep_working_on").map((t) => t.description);
  const beforeFlightItems = itemsForLastFlight.filter((t) => t.category === "before_next_flight").map((t) => t.description);
  const focusAreas = lastDebrief?.structuredResult.nextLessonFocus ?? [];

  const lastInstructor = lastFlight?.instructor ?? null;
  const lastInstructorNote = lastDebrief?.structuredResult.instructorGuidance[0] ?? null;
  const lastWentWell = lastDebrief?.structuredResult.wentWell.slice(0, 3) ?? [];
  const suggestedQuestion = buildSuggestedQuestion(focusAreas, keepWorkingOn);

  const recentCompleted = completed.slice(0, 4);
  const recentFlightIds = new Set(recentCompleted.map((f) => f.id));
  const signals = await repo.listTrainingSignals({ studentId });
  const recentSignals = signals.filter((s) => recentFlightIds.has(s.flightId) && !s.dismissed);
  const recurringThemes = computeRecurringThemes(recentSignals, recentCompleted.length);

  const now = Date.now();
  const upcomingReservation =
    reservations
      .filter((r) => r.status === "scheduled" && new Date(r.scheduledStart).getTime() >= now)
      .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart))[0] ?? null;

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
    recurringThemes,
    upcomingReservation,
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
function computeRecurringThemes(signals: TrainingSignal[], consideredFlights: number): RecurringTheme[] {
  if (consideredFlights < 2) return [];
  const flightsBySkill = new Map<string, Set<string>>();
  for (const signal of signals) {
    if (signal.status !== "NEEDS_COACHING") continue;
    if (!flightsBySkill.has(signal.skill)) flightsBySkill.set(signal.skill, new Set());
    flightsBySkill.get(signal.skill)!.add(signal.flightId);
  }
  return Array.from(flightsBySkill.entries())
    .map(([skill, flightIds]) => ({
      theme: skillLabel(skill as TrainingSignal["skill"]),
      skill: skill as TrainingSkill,
      count: flightIds.size,
      consideredFlights,
    }))
    .filter((t) => t.count >= 2)
    .sort((a, b) => b.count - a.count);
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
  if (!entry.pendingFlight && entry.mostRecentFlight?.debriefStatus === "complete" && entry.currentFocus.length === 0) {
    reasons.push("Next lesson has no objectives");
  }
  if (!entry.mostRecentFlight) {
    reasons.push("No recent training activity");
  }
  return reasons;
}
