import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import type { SchoolV2Overview } from "@/lib/school-v2/overview";
import { formatFlightDate } from "@/lib/utils";

/**
 * School V2's Overview -- "what needs attention" leads, "school at a
 * glance" is subordinate context underneath it, recent activity and the
 * Insights CTA follow. Deliberately not four KPI cards over a chart over a
 * table: the first thing on the page is a list of specific students and
 * specific reasons, not a stat.
 */
export function SchoolV2OverviewScreen({ data }: { data: SchoolV2Overview }) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-9 px-6 py-8 md:px-10 md:py-10">
      <header>
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">School overview</p>
        <h1 className="mt-1 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-foreground">{data.organizationName}</h1>
      </header>

      <section>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">What needs attention</h2>
        {data.attentionItems.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface px-5 py-4">
            <CheckCircle2 className="size-5 shrink-0 text-good" aria-hidden />
            <p className="text-[15px] text-foreground-soft">Nothing needs attention right now.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
            <div className="flex flex-col divide-y divide-hairline">
              {data.attentionItems.map((item) => (
                <Link
                  key={`${item.studentId}-${item.reason}`}
                  href={item.href}
                  className="flex items-start justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-surface-sunken"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-foreground">
                        {item.studentName} <span className="font-normal text-foreground-faint">· with {item.instructorName}</span>
                      </p>
                      <p className="mt-0.5 text-[14px] text-foreground-soft">
                        {item.detail}
                        {item.flightContext ? ` · ${formatFlightDate(item.flightContext)}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="mt-0.5 shrink-0 whitespace-nowrap rounded-md bg-amber-soft px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-amber-ink">
                    {item.statusLabel}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">School at a glance</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Active students" value={data.atAGlance.activeStudentCount} />
          <StatTile label="Instructors" value={data.atAGlance.activeInstructorCount} />
          <StatTile label="Flights, last 30 days" value={data.atAGlance.recentFlightCount30d} />
          <StatTile label="Need attention" value={data.atAGlance.attentionCount} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">Recent activity</h2>
        {data.recentActivity.length === 0 ? (
          <p className="text-[15px] text-foreground-faint">No flights logged yet.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
            <div className="flex flex-col divide-y divide-hairline">
              {data.recentActivity.map((item) => (
                <div key={item.flightId} className="flex items-center justify-between gap-4 px-5 py-3">
                  <p className="min-w-0 truncate text-[14px] text-foreground">
                    <span className="font-medium">{item.studentName}</span>
                    {item.instructorName ? <span className="text-foreground-faint"> · with {item.instructorName}</span> : null}
                  </p>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[13px] text-foreground-faint">{formatFlightDate(item.flightDate)}</span>
                    <span
                      className={
                        item.debriefStatus === "complete"
                          ? "rounded-md bg-good-soft px-2 py-0.5 text-[11px] font-semibold text-good-ink"
                          : "rounded-md bg-surface-sunken px-2 py-0.5 text-[11px] font-semibold text-foreground-soft"
                      }
                    >
                      {item.debriefStatus === "complete" ? "Debriefed" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <Link
        href="/school-v2/insights"
        className="flex items-center gap-1.5 self-start text-[14px] font-semibold text-brand"
      >
        See training insights across the school
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface px-4 py-3">
      <p className="text-[22px] font-semibold leading-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-[12px] text-foreground-faint">{label}</p>
    </div>
  );
}
