import { computeInstructorRoster } from "@/lib/training-memory";
import { computeDebriefProgress, debriefStageLabel } from "@/lib/debrief-progress";
import { STAGE_ACTION_INFO, debriefResolverHref } from "@/lib/cfi-v2/debrief-actions";
import { formatFlightDate } from "@/lib/utils";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";

type Roster = Awaited<ReturnType<typeof computeInstructorRoster>>;

export interface DebriefQueueItem {
  studentId: string;
  studentName: string;
  flightContext: string;
  reason: string;
  otherInstructorName: string | null;
  actionLabel: string;
  actionHref: string;
}

export interface CompletedDebriefItem {
  studentId: string;
  studentName: string;
  flightContext: string;
  resultsHref: string;
}

export interface CfiV2DebriefQueue {
  needsAction: DebriefQueueItem[];
  waiting: DebriefQueueItem[];
  recentlyCompleted: CompletedDebriefItem[];
}

/** How many recently-completed debriefs to surface -- continuity/reference only, never meant to dominate the page. */
const RECENTLY_COMPLETED_LIMIT = 8;

/**
 * The roster-wide priority queue behind /cfi-v2/debrief -- replaces V1's
 * split between Today's "Debrief In Progress" section and the standalone
 * Training page (a completed-only list), which were really the same
 * underlying computeDebriefProgress data sliced two different ways. One
 * queue, three groups: what needs the instructor's action now, what's
 * waiting on the student, and what finished recently for reference.
 *
 * Reuses computeInstructorRoster/computeDebriefProgress unchanged -- no
 * second lifecycle, no new status model. Every actionable item's href is
 * the single debrief resolver entry point (lib/cfi-v2/debrief-actions.ts),
 * so this queue and Today's Needs You Now can never send the instructor to
 * a stage-specific sub-route that's drifted from what the resolver would
 * actually do.
 */
export async function computeCfiV2DebriefQueue(repo: Repository, viewer: Viewer): Promise<CfiV2DebriefQueue> {
  const roster = await computeInstructorRoster(repo, viewer.user.id, viewer.organization.id);
  return groupDebriefQueue(repo, roster, viewer.user.id);
}

/**
 * The grouping logic on its own, separated from the roster fetch above so
 * it's directly testable against hand-built roster entries -- the same
 * split lib/cfi-v2/today.ts uses for needsYouNowFromRoster.
 */
export async function groupDebriefQueue(repo: Repository, roster: Roster, instructorId: string): Promise<CfiV2DebriefQueue> {
  const rankedNeedsAction: { item: DebriefQueueItem; priority: number }[] = [];
  const rankedWaiting: { item: DebriefQueueItem; priority: number }[] = [];
  const recentlyCompletedCandidates: { studentId: string; studentName: string; flightDate: string; flightId: string }[] = [];

  for (const entry of roster) {
    if (entry.pendingFlight) {
      const progress = await computeDebriefProgress(repo, entry.pendingFlight);
      if (progress.stage === "complete") continue; // defensive only -- pendingFlight already excludes complete flights.
      const action = STAGE_ACTION_INFO[progress.stage];
      const item: DebriefQueueItem = {
        studentId: entry.student.id,
        studentName: entry.student.name,
        flightContext: formatFlightDate(entry.pendingFlight.flightDate),
        reason: debriefStageLabel(progress),
        otherInstructorName:
          entry.pendingFlight.instructor && entry.pendingFlight.instructor.id !== instructorId
            ? entry.pendingFlight.instructor.name
            : null,
        actionLabel: action.ctaLabel,
        actionHref: debriefResolverHref(entry.pendingFlight.id),
      };
      (action.instructorActionable ? rankedNeedsAction : rankedWaiting).push({ item, priority: action.priority });
      continue;
    }

    if (entry.mostRecentFlight?.debriefStatus === "complete") {
      recentlyCompletedCandidates.push({
        studentId: entry.student.id,
        studentName: entry.student.name,
        flightDate: entry.mostRecentFlight.flightDate,
        flightId: entry.mostRecentFlight.id,
      });
    }
  }

  const byPriority = (a: { priority: number }, b: { priority: number }) => a.priority - b.priority;
  const needsAction = rankedNeedsAction.sort(byPriority).map((r) => r.item);
  const waiting = rankedWaiting.sort(byPriority).map((r) => r.item);

  const recentlyCompleted: CompletedDebriefItem[] = recentlyCompletedCandidates
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate))
    .slice(0, RECENTLY_COMPLETED_LIMIT)
    .map((c) => ({
      studentId: c.studentId,
      studentName: c.studentName,
      flightContext: formatFlightDate(c.flightDate),
      resultsHref: `/cfi-v2/flights/${c.flightId}/debrief/results`,
    }));

  return { needsAction, waiting, recentlyCompleted };
}
