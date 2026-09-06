import { computeInstructorRoster, computeNextLessonBrief, recurringThemeSummary } from "@/lib/training-memory";
import { computeDebriefProgress, debriefStageLabel } from "@/lib/debrief-progress";
import { STAGE_ACTION_INFO, debriefResolverHref } from "@/lib/cfi-v2/debrief-actions";
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

/** Anything with no pending flight sorts after every active debrief action. */
const NO_PENDING_FLIGHT_PRIORITY = 10;

/** Below this many days since the last flight, staleness alone isn't worth flagging -- see needsYouNowFromRoster's no-pending-flight branch. */
const STALE_DAYS_THRESHOLD = 21;

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
        actionHref: todaysFlight ? debriefResolverHref(todaysFlight.id) : `/cfi-v2/students/${reservation.studentId}`,
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

function daysSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate + "T12:00:00").getTime()) / (1000 * 60 * 60 * 24));
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
 *
 * CFI-V2-2 tightened the no-pending-flight branch: V1's attentionReasons()
 * fires on "No flight scheduled" alone, which isn't inherently urgent (most
 * of a healthy roster has no flight scheduled on any given day). This list
 * now only includes a student with no pending debrief for one of three
 * concrete, backend-supported reasons -- a recurring theme, a genuinely
 * stale gap since their last flight, or an upcoming lesson with no
 * objectives set for it yet. A student who's simply between lessons with
 * nothing else going on is correctly absent, not merely under-flagged --
 * "instructor handoff/continuity" and a bare "no flights yet" were
 * considered and deliberately left out of this pass: a real continuity
 * signal would need a per-student query this roster-wide list doesn't
 * already pay for, and a brand-new student with zero flights isn't
 * inherently urgent on its own. Both are reasonable additions for a later
 * pass, not silently dropped -- see the CFI-V2-2 report.
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
      const action = STAGE_ACTION_INFO[progress.stage];
      ranked.push({
        priority: action.priority,
        item: {
          studentId: entry.student.id,
          studentName: entry.student.name,
          reason: debriefStageLabel(progress),
          flightContext: formatFlightDate(entry.pendingFlight.flightDate),
          otherInstructorName:
            entry.pendingFlight.instructor && entry.pendingFlight.instructor.id !== instructorId
              ? entry.pendingFlight.instructor.name
              : null,
          actionLabel: action.ctaLabel,
          actionHref: debriefResolverHref(entry.pendingFlight.id),
        },
      });
      continue;
    }

    if (entry.topRecurringTheme) {
      ranked.push({
        priority: NO_PENDING_FLIGHT_PRIORITY,
        item: {
          studentId: entry.student.id,
          studentName: entry.student.name,
          reason: recurringThemeSummary(entry.topRecurringTheme),
          flightContext: null,
          otherInstructorName: null,
          actionLabel: "View student",
          actionHref: `/cfi-v2/students/${entry.student.id}`,
        },
      });
      continue;
    }

    if (entry.mostRecentFlight && daysSince(entry.mostRecentFlight.flightDate) >= STALE_DAYS_THRESHOLD) {
      ranked.push({
        priority: NO_PENDING_FLIGHT_PRIORITY,
        item: {
          studentId: entry.student.id,
          studentName: entry.student.name,
          reason: `No flight in ${daysSince(entry.mostRecentFlight.flightDate)} days`,
          flightContext: null,
          otherInstructorName: null,
          actionLabel: "View student",
          actionHref: `/cfi-v2/students/${entry.student.id}`,
        },
      });
      continue;
    }

    if (entry.nextReservation && !entry.hasNextLessonItems) {
      ranked.push({
        priority: NO_PENDING_FLIGHT_PRIORITY,
        item: {
          studentId: entry.student.id,
          studentName: entry.student.name,
          reason: "Upcoming lesson has no objectives yet",
          flightContext: null,
          otherInstructorName: null,
          actionLabel: "View student",
          actionHref: `/cfi-v2/students/${entry.student.id}#next-flight`,
        },
      });
    }
  }

  return ranked.sort((a, b) => a.priority - b.priority).map((r) => r.item);
}
