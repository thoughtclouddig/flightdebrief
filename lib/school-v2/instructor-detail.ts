import { computeContinuityForRoster, type SchoolContinuityItem } from "@/lib/school-v2/continuity";
import { computeSchoolV2Roster, type SchoolV2RosterEntry } from "@/lib/school-v2/roster";
import { schoolAttentionFromRoster, type SchoolAttentionItem } from "@/lib/school-v2/overview";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import type { DebriefStatus, User } from "@/lib/types";

export type { SchoolContinuityItem } from "@/lib/school-v2/continuity";

export interface SchoolV2InstructorFlightActivity {
  flightId: string;
  studentName: string;
  flightDate: string;
  debriefStatus: DebriefStatus;
}

export interface SchoolV2InstructorDetail {
  instructor: User;
  students: SchoolV2RosterEntry[];
  recentActivity: SchoolV2InstructorFlightActivity[];
  continuity: SchoolContinuityItem[];
  attentionItems: SchoolAttentionItem[];
}

/**
 * School V2's Instructor Detail -- a new destination (no canonical
 * /admin/instructors/[id] exists). Framed entirely around workload,
 * continuity, and where the school may need to support this instructor's
 * students -- never a quality judgment. No field here compares one
 * instructor to another.
 */
export async function computeSchoolV2InstructorDetail(
  repo: Repository,
  viewer: Viewer,
  instructorId: string,
): Promise<SchoolV2InstructorDetail | null> {
  const organizationId = viewer.organization.id;

  const [instructor, instructorMembers] = await Promise.all([
    repo.getUser(instructorId),
    repo.listMembers(organizationId, "instructor"),
  ]);
  if (!instructor) return null;

  const isActiveInstructor = instructorMembers.some((m) => m.userId === instructorId && m.status === "active");
  if (!isActiveInstructor) return null;

  const roster = await computeSchoolV2Roster(repo, organizationId);
  const students = roster.filter((entry) => entry.primaryInstructorId === instructorId);

  const [flights, attentionItems, continuity] = await Promise.all([
    repo.listFlights({ instructorId, organizationId }),
    schoolAttentionFromRoster(repo, students),
    computeContinuityForRoster(repo, students),
  ]);

  const recentFlights = [...flights].sort((a, b) => b.flightDate.localeCompare(a.flightDate)).slice(0, 8);
  const recentActivity: SchoolV2InstructorFlightActivity[] = await Promise.all(
    recentFlights.map(async (flight) => {
      const student = await repo.getUser(flight.userId);
      return {
        flightId: flight.id,
        studentName: student?.name ?? "—",
        flightDate: flight.flightDate,
        debriefStatus: flight.debriefStatus,
      };
    }),
  );

  return { instructor, students, recentActivity, continuity, attentionItems };
}
