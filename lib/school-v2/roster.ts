import { computeInstructorRoster, type StudentRosterEntry } from "@/lib/training-memory";
import type { Repository } from "@/lib/data/types";

export interface SchoolV2RosterEntry extends StudentRosterEntry {
  primaryInstructorId: string;
  primaryInstructorName: string;
}

/**
 * The school-wide student roster every School V2 screen builds on --
 * Overview's attention items, the Students list, and each Instructor
 * Detail's "current students" all read from this same call instead of each
 * re-deriving their own picture of who's on whose roster.
 *
 * There is no bulk "every student in this org, with their current
 * instructor" repository method (see lib/cfi-v2/roster.ts's own precedent:
 * CFI V2's roster is computeInstructorRoster for ONE instructor). This is
 * that same, already-audited function run once per active instructor and
 * flattened, not a new query -- reusing the identical roster/brief/staleness
 * computation CFI V2's Today and Student Detail already depend on, just
 * fanned out school-wide instead of scoped to a single signed-in CFI.
 *
 * Filtered to isPrimary && status === "active" per instructor's roster so a
 * student with a prior, now-inactive link (see a handoff student in the
 * demo seed) is counted exactly once, under their current instructor --
 * matching how the seed itself models a handoff as two StudentInstructor
 * rows for the same student.
 */
export async function computeSchoolV2Roster(repo: Repository, organizationId: string): Promise<SchoolV2RosterEntry[]> {
  const instructorMembers = (await repo.listMembers(organizationId, "instructor")).filter((m) => m.status === "active");

  const perInstructor = await Promise.all(
    instructorMembers.map(async (member) => {
      const instructorUser = await repo.getUser(member.userId);
      if (!instructorUser) return [];

      const roster = await computeInstructorRoster(repo, member.userId, organizationId);
      return roster
        .filter((entry) => entry.isPrimary && entry.status === "active")
        .map(
          (entry): SchoolV2RosterEntry => ({
            ...entry,
            primaryInstructorId: instructorUser.id,
            primaryInstructorName: instructorUser.name,
          }),
        );
    }),
  );

  return perInstructor.flat().sort((a, b) => a.student.name.localeCompare(b.student.name));
}
