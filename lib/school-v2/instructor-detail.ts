import { computeSchoolV2Roster, type SchoolV2RosterEntry } from "@/lib/school-v2/roster";
import { schoolAttentionFromRoster, type SchoolAttentionItem } from "@/lib/school-v2/overview";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import type { DebriefStatus, User } from "@/lib/types";

export interface SchoolV2ContinuityItem {
  studentId: string;
  studentName: string;
  priorInstructorName: string;
  /** StudentInstructor.createdAt for the CURRENT link -- when this instructor took over, not when the handoff was "announced". */
  since: string;
}

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
  continuity: SchoolV2ContinuityItem[];
  attentionItems: SchoolAttentionItem[];
}

/**
 * Real, narrow continuity derivation -- not the "continuity-summary
 * function" the SCHOOL-V2-1 report names as a backend gap (an aggregate
 * rollup/score doesn't exist and isn't built here). This only asks, per
 * student currently on this instructor's roster: does a second,
 * non-primary StudentInstructor row exist for them, naming a different
 * instructor? That's exactly what the demo seed's three handoff pairs
 * create (an inactive prior link alongside the new active-primary one), and
 * it's true of any real handoff in production data the same way -- no
 * proxy, no invented metric, just reading the rows that already exist.
 */
export async function computeContinuity(
  repo: Repository,
  students: SchoolV2RosterEntry[],
  instructorId: string,
): Promise<SchoolV2ContinuityItem[]> {
  const items = await Promise.all(
    students.map(async (entry): Promise<SchoolV2ContinuityItem | null> => {
      const links = await repo.listInstructorLinksForStudent(entry.student.id);
      const currentLink = links.find((l) => l.instructorId === instructorId && l.isPrimary && l.status === "active");
      if (!currentLink) return null;

      const priorLink = links.find((l) => l.id !== currentLink.id && l.instructorId !== instructorId);
      if (!priorLink) return null;

      const priorInstructor = await repo.getUser(priorLink.instructorId);
      if (!priorInstructor) return null;

      return {
        studentId: entry.student.id,
        studentName: entry.student.name,
        priorInstructorName: priorInstructor.name,
        since: currentLink.createdAt,
      };
    }),
  );

  return items.filter((i): i is SchoolV2ContinuityItem => i !== null);
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
    computeContinuity(repo, students, instructorId),
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
