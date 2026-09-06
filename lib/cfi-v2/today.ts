import { attentionReasons, computeInstructorRoster, computeNextLessonBrief } from "@/lib/training-memory";
import { computeDebriefProgress, debriefStageLabel, type DebriefStage } from "@/lib/debrief-progress";
import { localIsoDate } from "@/lib/date";
import { formatFlightDate } from "@/lib/utils";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";

export interface TodayLesson {
  reservationId: string;
  studentId: string;
  studentName: string;
  scheduledStart: string;
  tailNumber: string;
  aircraftType: string;
  currentFocus: string[];
  actionLabel: string;
  actionHref: string;
}

export interface UpcomingLesson {
  reservationId: string;
  studentId: string;
  studentName: string;
  scheduledStart: string;
  tailNumber: string;
}

export interface NeedsYouNowItem {
  studentId: string;
  studentName: string;
  reason: string;
  flightContext: string | null;
  otherInstructorName: string | null;
  actionLabel: string;
  actionHref: string;
}

export interface CfiV2Today {
  needsYouNow: NeedsYouNowItem[];
  todaysSchedule: TodayLesson[];
  thisWeek: UpcomingLesson[];
  isAllCaughtUp: boolean;
}

/**
 * One action per debrief stage, keyed off the DebriefStage enum itself
 * rather than any display label -- see the ATTENTION BUG note on
 * needsYouNowFromRoster below for why that distinction matters.
 */
const STAGE_ACTION: Record<Exclude<DebriefStage, "complete">, { label: string; href: (flightId: string) => string }> = {
  awaiting_tasks: { label: "Confirm objectives", href: (id) => `/flights/${id}/debrief/tasks` },
  awaiting_student_assessment: { label: "View flight", href: (id) => `/flights/${id}` },
  awaiting_instructor_assessment: { label: "Assess flight", href: (id) => `/flights/${id}/debrief/instructor-assessment` },
  ready_to_debrief: { label: "Record debrief", href: (id) => `/flights/${id}/debrief` },
  awaiting_finish: { label: "Finish review", href: (id) => `/flights/${id}/debrief/review` },
};

/** Lower number = more urgent. "Waiting on student" sits last -- nothing here is the instructor's next move. */
const STAGE_PRIORITY: Record<Exclude<DebriefStage, "complete">, number> = {
  awaiting_finish: 0,
  ready_to_debrief: 1,
  awaiting_instructor_assessment: 2,
  awaiting_tasks: 3,
  awaiting_student_assessment: 4,
};

/** Anything with no pending flight sorts after every active debrief action. */
const NO_PENDING_FLIGHT_PRIORITY = 10;

export async function computeCfiV2Today(repo: Repository, viewer: Viewer): Promise<CfiV2Today> {
  const instructorId = viewer.user.id;
  const [reservations, roster] = await Promise.all([
    repo.listReservations({ organizationId: viewer.organization.id, instructorId }),
    computeInstructorRoster(repo, instructorId, viewer.organization.id),
  ]);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todaysReservations = reservations
    .filter((r) => {
      const t = new Date(r.scheduledStart).getTime();
      return r.status === "scheduled" && t >= startOfDay.getTime() && t <= endOfDay.getTime();
    })
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));

  const todaysSchedule: TodayLesson[] = await Promise.all(
    todaysReservations.map(async (reservation) => {
      const [student, aircraft, brief, studentFlights] = await Promise.all([
        repo.getUser(reservation.studentId),
        repo.getAircraft(reservation.aircraftId),
        computeNextLessonBrief(repo, reservation.studentId),
        repo.listFlights({ studentId: reservation.studentId }),
      ]);
      const todaysFlight = studentFlights.find((f) => f.flightDate === localIsoDate() && f.debriefStatus !== "complete");
      return {
        reservationId: reservation.id,
        studentId: reservation.studentId,
        studentName: student?.name ?? "—",
        scheduledStart: reservation.scheduledStart,
        tailNumber: aircraft?.tailNumber ?? "—",
        aircraftType: aircraft?.type ?? "—",
        currentFocus: brief.focusAreas,
        actionLabel: todaysFlight ? "Open brief" : "View student",
        actionHref: todaysFlight ? `/flights/${todaysFlight.id}/debrief` : `/cfi-v2/students/${reservation.studentId}`,
      };
    }),
  );

  const weekEnd = new Date(endOfDay.getTime() + 6 * 24 * 60 * 60 * 1000);
  const thisWeek: UpcomingLesson[] = await Promise.all(
    reservations
      .filter((r) => {
        const t = new Date(r.scheduledStart).getTime();
        return r.status === "scheduled" && t > endOfDay.getTime() && t <= weekEnd.getTime();
      })
      .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart))
      .map(async (reservation) => {
        const [student, aircraft] = await Promise.all([
          repo.getUser(reservation.studentId),
          repo.getAircraft(reservation.aircraftId),
        ]);
        return {
          reservationId: reservation.id,
          studentId: reservation.studentId,
          studentName: student?.name ?? "—",
          scheduledStart: reservation.scheduledStart,
          tailNumber: aircraft?.tailNumber ?? "—",
        };
      }),
  );

  const needsYouNow = await needsYouNowFromRoster(repo, roster, instructorId);

  return {
    needsYouNow,
    todaysSchedule,
    thisWeek,
    isAllCaughtUp: todaysSchedule.length === 0 && thisWeek.length === 0 && needsYouNow.length === 0,
  };
}

/**
 * Unifies V1's "Debrief In Progress" and "Students Needing Attention" into
 * one priority-sorted list -- the same student's state no longer appears in
 * two unrelated sections depending on which stage a pending debrief happens
 * to be in.
 *
 * This is also where the audit's dead-code finding gets resolved, by
 * construction rather than by patching the old string comparison: V1's
 * app/(product)/cfi/today/page.tsx links a badge to /debrief/tasks only when
 * the reason text is exactly "Debrief not started" -- a string
 * debriefStageLabel() hasn't produced since it was renamed to "Objectives
 * not confirmed yet" for the awaiting_tasks stage, so that branch can never
 * fire. Dispatching on DebriefProgress.stage (the actual enum) instead of
 * re-parsing a display label makes that whole class of mismatch impossible
 * here -- there's no string to fall out of sync with in the first place.
 * V1's file is left untouched; it stays this milestone's frozen functional
 * reference.
 */
export async function needsYouNowFromRoster(
  repo: Repository,
  roster: Awaited<ReturnType<typeof computeInstructorRoster>>,
  instructorId: string,
): Promise<NeedsYouNowItem[]> {
  const ranked: { item: NeedsYouNowItem; priority: number }[] = [];

  for (const entry of roster) {
    if (entry.pendingFlight) {
      const progress = await computeDebriefProgress(repo, entry.pendingFlight);
      if (progress.stage === "complete") continue; // pendingFlight excludes complete flights already; defensive only.
      const action = STAGE_ACTION[progress.stage];
      ranked.push({
        priority: STAGE_PRIORITY[progress.stage],
        item: {
          studentId: entry.student.id,
          studentName: entry.student.name,
          reason: debriefStageLabel(progress),
          flightContext: formatFlightDate(entry.pendingFlight.flightDate),
          otherInstructorName:
            entry.pendingFlight.instructor && entry.pendingFlight.instructor.id !== instructorId
              ? entry.pendingFlight.instructor.name
              : null,
          actionLabel: action.label,
          actionHref: action.href(entry.pendingFlight.id),
        },
      });
      continue;
    }

    const reasons = attentionReasons(entry);
    if (reasons.length === 0) continue;
    ranked.push({
      priority: NO_PENDING_FLIGHT_PRIORITY,
      item: {
        studentId: entry.student.id,
        studentName: entry.student.name,
        reason: reasons.join(" · "),
        flightContext: null,
        otherInstructorName: null,
        actionLabel: "View student",
        actionHref: `/cfi-v2/students/${entry.student.id}`,
      },
    });
  }

  return ranked.sort((a, b) => a.priority - b.priority).map((r) => r.item);
}
