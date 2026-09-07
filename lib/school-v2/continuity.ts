import { recurringThemeSummary } from "@/lib/training-memory";
import type { SchoolV2RosterEntry } from "@/lib/school-v2/roster";
import type { Repository } from "@/lib/data/types";

export interface SchoolContinuityItem {
  studentId: string;
  studentName: string;
  priorInstructorName: string;
  currentInstructorName: string;
  /** StudentInstructor.createdAt for the CURRENT link -- when this instructor took over, not when the handoff was "announced". */
  since: string;
  /**
   * The student's own strongest recurring theme, summarized verbatim via
   * recurringThemeSummary -- non-null here means the SAME theme was already
   * recurring for this student, i.e. it didn't start with, and hasn't
   * resolved because of, the instructor change. Null just means this
   * student had a handoff with no (or no longer any) recurring theme --
   * still a real handoff, just not evidence a training issue carried
   * across it.
   */
  themeSummary: string | null;
}

/**
 * Real, narrow continuity derivation -- not the "continuity-summary
 * function" the SCHOOL-V2-1 report names as a backend gap (an aggregate
 * rollup/score doesn't exist and isn't built here). This only asks, per
 * roster entry: does a second, non-primary StudentInstructor row exist for
 * them, naming a different instructor than their current one? That's
 * exactly what the demo seed's three handoff pairs create (an inactive
 * prior link alongside the new active-primary one), and it's true of any
 * real handoff in production data the same way -- no proxy, no invented
 * metric, just reading the rows that already exist.
 *
 * Roster-agnostic on purpose: pass a single instructor's students (School
 * V2's Instructor Detail) or the whole org's roster (Insights' school-wide
 * continuity view) -- the derivation and its "did the theme carry across
 * the handoff" question are identical either way, so both callers share
 * this one function instead of two copies of the same logic.
 */
export async function computeContinuityForRoster(
  repo: Repository,
  roster: SchoolV2RosterEntry[],
): Promise<SchoolContinuityItem[]> {
  const items = await Promise.all(
    roster.map(async (entry): Promise<SchoolContinuityItem | null> => {
      const links = await repo.listInstructorLinksForStudent(entry.student.id);
      const currentLink = links.find(
        (l) => l.instructorId === entry.primaryInstructorId && l.isPrimary && l.status === "active",
      );
      if (!currentLink) return null;

      const priorLink = links.find((l) => l.id !== currentLink.id && l.instructorId !== entry.primaryInstructorId);
      if (!priorLink) return null;

      const priorInstructor = await repo.getUser(priorLink.instructorId);
      if (!priorInstructor) return null;

      return {
        studentId: entry.student.id,
        studentName: entry.student.name,
        priorInstructorName: priorInstructor.name,
        currentInstructorName: entry.primaryInstructorName,
        since: currentLink.createdAt,
        themeSummary: entry.topRecurringTheme ? recurringThemeSummary(entry.topRecurringTheme) : null,
      };
    }),
  );

  return items.filter((i): i is SchoolContinuityItem => i !== null);
}
