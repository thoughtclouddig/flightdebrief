import { computeDebriefProgress, type DebriefStage } from "@/lib/debrief-progress";
import { STAGE_ACTION_INFO } from "@/lib/cfi-v2/debrief-actions";
import { recurringThemeSummary } from "@/lib/training-memory";
import { STALE_DAYS_THRESHOLD } from "@/lib/cfi-v2/today";
import { computeSchoolV2Roster, type SchoolV2RosterEntry } from "@/lib/school-v2/roster";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import type { DebriefStatus } from "@/lib/types";

/** Sorts after every active debrief-lifecycle reason -- mirrors lib/cfi-v2/today.ts's identical constant. */
const NO_PENDING_FLIGHT_PRIORITY = 10;

export type SchoolAttentionReason = "unresolved_debrief" | "recurring_theme" | "stale_gap" | "no_objectives_yet";

export interface SchoolAttentionItem {
  studentId: string;
  studentName: string;
  instructorName: string;
  reason: SchoolAttentionReason;
  /**
   * Short, truthful status word/phrase for a badge -- never an instruction
   * to the school admin. For "unresolved_debrief" this names who the
   * lifecycle is actually waiting on (DebriefProgress.waitingOn, a real
   * backend-computed field, never invented) rather than a generic "Debrief"
   * word that read as an action for the school to take.
   */
  statusLabel: string;
  detail: string;
  flightContext: string | null;
  href: string;
}

export interface SchoolAtAGlance {
  activeStudentCount: number;
  activeInstructorCount: number;
  recentFlightCount30d: number;
  attentionCount: number;
}

export interface SchoolRecentActivityItem {
  flightId: string;
  studentName: string;
  instructorName: string | null;
  flightDate: string;
  debriefStatus: DebriefStatus;
}

export interface SchoolV2Overview {
  organizationName: string;
  attentionItems: SchoolAttentionItem[];
  atAGlance: SchoolAtAGlance;
  recentActivity: SchoolRecentActivityItem[];
}

function daysSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate + "T12:00:00").getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Neutral, third-party phrasing for a debrief stage -- lib/debrief-progress.ts's
 * own debriefStageLabel() says "your assessment"/"pending your review",
 * which is right for the CFI living the lifecycle and wrong for a school
 * admin looking at someone else's. Same stage, same computeDebriefProgress
 * result, different copy for a different viewer -- not a second lifecycle.
 */
function neutralStageLabel(stage: Exclude<DebriefStage, "complete">): string {
  switch (stage) {
    case "awaiting_tasks":
      return "Objectives not confirmed yet";
    case "awaiting_instructor_assessment":
      return "Waiting on the instructor's assessment";
    case "awaiting_student_assessment":
      return "Waiting on the student";
    case "ready_to_debrief":
      return "Ready to debrief";
    case "awaiting_finish":
      return "Recorded -- pending instructor review";
  }
}

/**
 * The status badge for an in-flight debrief -- named by who the lifecycle
 * is actually waiting on (DebriefProgress.waitingOn), not a bare "Debrief"
 * word that reads as an action request to the school admin. waitingOn is
 * only null at stage "complete", which pendingFlight already excludes, so
 * the fallback below is defensive, not a real case.
 */
function debriefStatusLabel(waitingOn: "instructor" | "student" | null): string {
  if (waitingOn === "instructor") return "Waiting on CFI";
  if (waitingOn === "student") return "Waiting on student";
  return "Debrief pending";
}

/**
 * The school-wide analog of lib/cfi-v2/today.ts's needsYouNowFromRoster --
 * same four backend-supported reasons (an in-flight debrief stuck somewhere
 * in the lifecycle, a recurring theme, a genuinely stale gap since the last
 * flight, or an upcoming lesson with no objectives set), run across every
 * student in the school instead of one instructor's roster, and pointed at
 * School V2's own read-only Student Detail rather than a CFI action.
 *
 * Deliberately excludes two of the product brief's candidate reasons:
 * "instructor handoff/continuity" and "repeated perception gap" have no
 * existing aggregate function to reuse (see the SCHOOL-V2-1 report's gap
 * list) -- adding either here would mean inventing a new schoolwide
 * computation rather than recomposing one that already exists, which is
 * exactly the kind of fabricated proxy this milestone was told not to add.
 */
export async function schoolAttentionFromRoster(
  repo: Repository,
  roster: SchoolV2RosterEntry[],
): Promise<SchoolAttentionItem[]> {
  const ranked: { item: SchoolAttentionItem; priority: number }[] = [];

  for (const entry of roster) {
    const href = `/school-v2/students/${entry.student.id}`;

    if (entry.pendingFlight) {
      const progress = await computeDebriefProgress(repo, entry.pendingFlight);
      if (progress.stage === "complete") continue; // pendingFlight already excludes complete flights; defensive only.
      ranked.push({
        priority: STAGE_ACTION_INFO[progress.stage].priority,
        item: {
          studentId: entry.student.id,
          studentName: entry.student.name,
          instructorName: entry.primaryInstructorName,
          reason: "unresolved_debrief",
          statusLabel: debriefStatusLabel(progress.waitingOn),
          detail: neutralStageLabel(progress.stage),
          flightContext: entry.pendingFlight.flightDate,
          href,
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
          instructorName: entry.primaryInstructorName,
          reason: "recurring_theme",
          statusLabel: "Recurring",
          detail: recurringThemeSummary(entry.topRecurringTheme),
          flightContext: null,
          href,
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
          instructorName: entry.primaryInstructorName,
          reason: "stale_gap",
          statusLabel: "Training gap",
          detail: `No flight in ${daysSince(entry.mostRecentFlight.flightDate)} days`,
          flightContext: null,
          href,
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
          instructorName: entry.primaryInstructorName,
          reason: "no_objectives_yet",
          statusLabel: "Unplanned",
          detail: "Upcoming lesson has no objectives yet",
          flightContext: null,
          href: `${href}#next-flight`,
        },
      });
    }
  }

  return ranked.sort((a, b) => a.priority - b.priority).map((r) => r.item);
}

/**
 * School V2's Overview -- "what needs attention" first, "school at a
 * glance" second, recent activity third. See app/(product)/admin/overview/
 * page.tsx for the canonical page this replaces the presentation of; the
 * stat tiles there (active students/instructors/flights) are reused as
 * plain counts here, never reframed as a score.
 */
export async function computeSchoolV2Overview(repo: Repository, viewer: Viewer): Promise<SchoolV2Overview> {
  const organizationId = viewer.organization.id;

  const [roster, instructorMembers, orgFlights] = await Promise.all([
    computeSchoolV2Roster(repo, organizationId),
    repo.listMembers(organizationId, "instructor"),
    repo.listFlights({ organizationId }),
  ]);

  const attentionItems = await schoolAttentionFromRoster(repo, roster);

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentFlightCount30d = orgFlights.filter((f) => new Date(f.flightDate + "T12:00:00").getTime() >= thirtyDaysAgo).length;

  const recentFlights = [...orgFlights].sort((a, b) => b.flightDate.localeCompare(a.flightDate)).slice(0, 8);
  const recentActivity: SchoolRecentActivityItem[] = await Promise.all(
    recentFlights.map(async (flight) => {
      const student = await repo.getUser(flight.userId);
      return {
        flightId: flight.id,
        studentName: student?.name ?? "—",
        instructorName: flight.instructor?.name ?? null,
        flightDate: flight.flightDate,
        debriefStatus: flight.debriefStatus,
      };
    }),
  );

  return {
    organizationName: viewer.organization.name,
    attentionItems,
    atAGlance: {
      activeStudentCount: roster.length,
      activeInstructorCount: instructorMembers.filter((m) => m.status === "active").length,
      recentFlightCount30d,
      attentionCount: attentionItems.length,
    },
    recentActivity,
  };
}
