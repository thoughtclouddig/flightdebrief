import Link from "next/link";
import { ArrowRightLeft } from "lucide-react";
import type { SchoolV2InstructorDetail } from "@/lib/school-v2/instructor-detail";
import { formatFlightDate } from "@/lib/utils";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">{title}</h2>
      <div className="rounded-2xl border border-hairline bg-surface px-5 py-4">{children}</div>
    </section>
  );
}

/**
 * School V2's Instructor Detail -- a new destination, no canonical
 * equivalent. Every section is framed around workload, continuity, and
 * where the school might help, never a judgment of the instructor: no
 * quality score, no "better than", no student-outcome rollup attributed to
 * them.
 */
export function SchoolV2InstructorDetailScreen({ detail }: { detail: SchoolV2InstructorDetail }) {
  const { instructor, students, recentActivity, continuity, attentionItems } = detail;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
      <header>
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">Instructor</p>
        <h1 className="mt-1 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-foreground">{instructor.name}</h1>
        <p className="mt-1 text-[14px] text-foreground-soft">
          {students.length} student{students.length === 1 ? "" : "s"} currently
        </p>
      </header>

      <SectionCard title="Current students">
        {students.length === 0 ? (
          <p className="text-[15px] text-foreground-faint">No students currently assigned.</p>
        ) : (
          <div className="flex flex-col divide-y divide-hairline">
            {students.map((entry) => (
              <Link
                key={entry.student.id}
                href={`/school-v2/students/${entry.student.id}`}
                className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0 hover:text-brand"
              >
                <span className="text-[15px] font-medium text-foreground">{entry.student.name}</span>
                <span className="shrink-0 text-[13px] text-foreground-faint">
                  {entry.mostRecentFlight ? `Last flew ${formatFlightDate(entry.mostRecentFlight.flightDate)}` : "No flights yet"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Recent training activity">
        {recentActivity.length === 0 ? (
          <p className="text-[15px] text-foreground-faint">No flights logged yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-hairline">
            {recentActivity.map((flight) => (
              <div key={flight.flightId} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                <span className="text-[14px] text-foreground">{flight.studentName}</span>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-[13px] text-foreground-faint">{formatFlightDate(flight.flightDate)}</span>
                  <span
                    className={
                      flight.debriefStatus === "complete"
                        ? "rounded-md bg-good-soft px-2 py-0.5 text-[11px] font-semibold text-good-ink"
                        : "rounded-md bg-surface-sunken px-2 py-0.5 text-[11px] font-semibold text-foreground-soft"
                    }
                  >
                    {flight.debriefStatus === "complete" ? "Debriefed" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {continuity.length > 0 ? (
        <SectionCard title="Continuity / handoffs">
          <div className="flex flex-col divide-y divide-hairline">
            {continuity.map((item) => (
              <div key={item.studentId} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <ArrowRightLeft className="size-4 shrink-0 text-foreground-faint" aria-hidden />
                <p className="text-[14px] text-foreground-soft">
                  <Link href={`/school-v2/students/${item.studentId}`} className="font-medium text-foreground hover:text-brand">
                    {item.studentName}
                  </Link>{" "}
                  moved from {item.priorInstructorName} on{" "}
                  {new Date(item.since).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {attentionItems.length > 0 ? (
        <SectionCard title="Students needing attention">
          <div className="flex flex-col divide-y divide-hairline">
            {attentionItems.map((item) => (
              <Link
                key={item.studentId}
                href={item.href}
                className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0 hover:text-brand"
              >
                <span className="text-[14px] font-medium text-foreground">{item.studentName}</span>
                <span className="shrink-0 text-[13px] text-foreground-faint">{item.detail}</span>
              </Link>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
