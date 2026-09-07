import { computeSchoolV2Roster } from "@/lib/school-v2/roster";
import type { Repository } from "@/lib/data/types";
import type { User } from "@/lib/types";

export interface SchoolV2InstructorSummary {
  instructor: User;
  activeStudentCount: number;
  recentFlightDate: string | null;
}

/**
 * School V2's instructor roster -- identity, current workload (student
 * count), and recency, reusing the same school-wide roster Overview and
 * Students already share instead of re-querying
 * listStudentLinksForInstructor per instructor the way canonical
 * app/(product)/admin/instructors/page.tsx does. No score, no ranking, no
 * ordering by any performance signal -- sorted by name only.
 */
export async function computeSchoolV2Instructors(repo: Repository, organizationId: string): Promise<SchoolV2InstructorSummary[]> {
  const [roster, instructorMembers] = await Promise.all([
    computeSchoolV2Roster(repo, organizationId),
    repo.listMembers(organizationId, "instructor"),
  ]);

  const activeMembers = instructorMembers.filter((m) => m.status === "active");

  const summaries = await Promise.all(
    activeMembers.map(async (member): Promise<SchoolV2InstructorSummary | null> => {
      const instructor = await repo.getUser(member.userId);
      if (!instructor) return null;

      const students = roster.filter((entry) => entry.primaryInstructorId === instructor.id);
      const recentFlightDate =
        students
          .map((entry) => entry.mostRecentFlight?.flightDate)
          .filter((date): date is string => Boolean(date))
          .sort()
          .reverse()[0] ?? null;

      return { instructor, activeStudentCount: students.length, recentFlightDate };
    }),
  );

  return summaries
    .filter((s): s is SchoolV2InstructorSummary => s !== null)
    .sort((a, b) => a.instructor.name.localeCompare(b.instructor.name));
}
