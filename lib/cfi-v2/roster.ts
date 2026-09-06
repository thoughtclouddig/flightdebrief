import { attentionReasons, computeInstructorRoster } from "@/lib/training-memory";
import { computeDebriefProgress, debriefStageLabel } from "@/lib/debrief-progress";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";

export type RosterStatusTone = "attention" | "waiting" | "good";

export interface CfiV2RosterEntry {
  studentId: string;
  studentName: string;
  isPrimary: boolean;
  currentFocus: string[];
  lastActivity: { flightDate: string; durationMinutes: number } | null;
  nextLesson: { scheduledStart: string } | null;
  statusLabel: string;
  statusTone: RosterStatusTone;
}

/**
 * One card per student, prioritizing the training context a CFI actually
 * scans for (focus, last activity, next lesson, what needs attention) over
 * raw account fields -- see lib/training-memory.ts's StudentRosterEntry for
 * the underlying roster query this reuses unchanged.
 */
export async function computeCfiV2Roster(repo: Repository, viewer: Viewer): Promise<CfiV2RosterEntry[]> {
  const roster = await computeInstructorRoster(repo, viewer.user.id, viewer.organization.id);

  return Promise.all(
    roster.map(async (entry) => {
      let statusLabel: string;
      let statusTone: RosterStatusTone;

      if (entry.pendingFlight) {
        const progress = await computeDebriefProgress(repo, entry.pendingFlight);
        statusLabel = debriefStageLabel(progress);
        statusTone = progress.stage === "awaiting_student_assessment" ? "waiting" : "attention";
      } else {
        const reasons = attentionReasons(entry);
        if (reasons.length > 0) {
          statusLabel = reasons[0]!;
          statusTone = "attention";
        } else {
          statusLabel = "On track";
          statusTone = "good";
        }
      }

      return {
        studentId: entry.student.id,
        studentName: entry.student.name,
        isPrimary: entry.isPrimary,
        currentFocus: entry.currentFocus,
        lastActivity: entry.mostRecentFlight
          ? { flightDate: entry.mostRecentFlight.flightDate, durationMinutes: entry.mostRecentFlight.durationMinutes }
          : null,
        nextLesson: entry.nextReservation ? { scheduledStart: entry.nextReservation.scheduledStart } : null,
        statusLabel,
        statusTone,
      };
    }),
  );
}
