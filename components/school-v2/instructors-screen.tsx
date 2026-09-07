import Link from "next/link";
import type { SchoolV2InstructorSummary } from "@/lib/school-v2/instructors";
import { formatFlightDate } from "@/lib/utils";

/**
 * School V2's instructor roster -- identity, current workload, recency.
 * Deliberately no quality score, ranking, agreement percentage, or
 * leaderboard ordering: rows sort by name, and the only number shown is a
 * plain student count, the same fact canonical /admin/instructors already
 * shows.
 */
export function SchoolV2InstructorsScreen({ instructors }: { instructors: SchoolV2InstructorSummary[] }) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <header>
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">{instructors.length} instructors</p>
        <h1 className="mt-1 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-foreground">Instructors</h1>
      </header>

      {instructors.length === 0 ? (
        <p className="py-8 text-center text-[15px] text-foreground-faint">No active instructors yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
          <div className="flex flex-col divide-y divide-hairline">
            {instructors.map(({ instructor, activeStudentCount, recentFlightDate }) => (
              <Link
                key={instructor.id}
                href={`/school-v2/instructors/${instructor.id}`}
                className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-surface-sunken"
              >
                <p className="text-[15px] font-semibold text-foreground">{instructor.name}</p>
                <div className="flex shrink-0 items-center gap-4 text-[13px] text-foreground-soft">
                  <span>
                    {activeStudentCount} student{activeStudentCount === 1 ? "" : "s"}
                  </span>
                  <span className="text-foreground-faint">
                    {recentFlightDate ? `Last flight ${formatFlightDate(recentFlightDate)}` : "No recent flights"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
