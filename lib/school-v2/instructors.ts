import { schoolAttentionFromRoster } from "@/lib/school-v2/overview";
import { computeSchoolV2Roster } from "@/lib/school-v2/roster";
import type { Repository } from "@/lib/data/types";
import type { User } from "@/lib/types";

export interface SchoolV2InstructorSummary {
  instructor: User;
  activeStudentCount: number;
  recentFlightDate: string | null;
  /** Count of this instructor's current students who appear in schoolAttentionFromRoster -- the SAME logic Overview/Students use, not a second definition. Describes student need, never instructor performance. */
  attentionCount: number;
}

/**
 * School V2's instructor roster -- identity, current workload (student
 * count), recency, and how many of their current students need attention,
 * reusing the same school-wide roster and attention logic Overview/Students
 * already share instead of re-querying listStudentLinksForInstructor per
 * instructor the way canonical app/(product)/admin/instructors/page.tsx
 * does. No score, no ranking, no ordering by any performance signal --
 * sorted by name only. attentionCount describes STUDENT needs on this
 * instructor's roster, not the instructor's own performance -- it is never
 * used to color, rank, or compare instructors against each other.
 */
export async function computeSchoolV2Instructors(repo: Repository, organizationId: string): Promise<SchoolV2InstructorSummary[]> {
  const [roster, instructorMembers] = await Promise.all([
    computeSchoolV2Roster(repo, organizationId),
    repo.listMembers(organizationId, "instructor"),
  ]);

  const attentionItems = await schoolAttentionFromRoster(repo, roster);
  const attentionStudentIds = new Set(attentionItems.map((item) => item.studentId));

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
      const attentionCount = students.filter((entry) => attentionStudentIds.has(entry.student.id)).length;

      return { instructor, activeStudentCount: students.length, recentFlightDate, attentionCount };
    }),
  );

  return summaries
    .filter((s): s is SchoolV2InstructorSummary => s !== null)
    .sort((a, b) => a.instructor.name.localeCompare(b.instructor.name));
}
