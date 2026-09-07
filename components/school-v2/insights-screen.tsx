import Link from "next/link";
import { ArrowRightLeft } from "lucide-react";
import type { SchoolV2Insights } from "@/lib/school-v2/insights";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">{title}</h2>
      <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">{children}</div>
    </section>
  );
}

/**
 * School V2's Insights -- school-wide training patterns, not a repeat of
 * Overview's "who needs attention right now" queue. Every section is
 * omitted entirely (not shown empty) when the underlying data doesn't
 * support it -- see lib/school-v2/insights.ts for exactly which existing
 * business logic backs each one. Ranked rows and plain counts throughout,
 * deliberately not a KPI-card/chart/leaderboard dashboard.
 */
export function SchoolV2InsightsScreen({ data }: { data: SchoolV2Insights }) {
  const hasAnything =
    data.recurringPatterns.length > 0 ||
    data.coverage.length > 0 ||
    data.needsWork.length > 0 ||
    data.continuity.length > 0 ||
    data.studentsToWatch.length > 0;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-9 px-6 py-8 md:px-10 md:py-10">
      <header>
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">School overview</p>
        <h1 className="mt-1 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-foreground">Insights</h1>
        <p className="mt-1 text-[14px] text-foreground-soft">Patterns emerging across the school -- not today&rsquo;s workflow queue.</p>
      </header>

      {!hasAnything ? (
        <p className="text-[15px] text-foreground-faint">Nothing patterned yet -- check back once more debriefs have been recorded.</p>
      ) : null}

      {data.recurringPatterns.length > 0 ? (
        <SectionCard title="Recurring across the school">
          <div className="flex flex-col divide-y divide-hairline">
            {data.recurringPatterns.map((pattern) => (
              <div key={pattern.skill} className="px-5 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[15px] font-semibold text-foreground">{pattern.label}</p>
                  <p className="shrink-0 text-[13px] text-foreground-faint">
                    {pattern.studentCount} student{pattern.studentCount === 1 ? "" : "s"} · {pattern.instructorCount} instructor
                    {pattern.instructorCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {pattern.students.map((s) => (
                    <Link key={s.id} href={s.href} className="text-[13px] text-foreground-soft hover:text-brand">
                      {s.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {data.coverage.length > 0 || data.needsWork.length > 0 ? (
        <section>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">Training coverage &amp; themes</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {data.coverage.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
                <p className="border-b border-hairline px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-foreground-faint">
                  Most trained, last 60 days
                </p>
                <div className="flex flex-col divide-y divide-hairline">
                  {data.coverage.map((item) => (
                    <div key={item.skill} className="flex items-center justify-between gap-3 px-5 py-2.5">
                      <p className="text-[14px] text-foreground">{item.label}</p>
                      <p className="shrink-0 text-[13px] text-foreground-faint">{item.occurrences}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {data.needsWork.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
                <p className="border-b border-hairline px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-foreground-faint">
                  Currently needing work
                </p>
                <div className="flex flex-col divide-y divide-hairline">
                  {data.needsWork.map((item) => (
                    <div key={item.skill} className="flex items-center justify-between gap-3 px-5 py-2.5">
                      <p className="text-[14px] text-foreground">{item.label}</p>
                      <p className="shrink-0 text-[13px] text-foreground-faint">
                        {item.studentCount} student{item.studentCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {data.continuity.length > 0 ? (
        <SectionCard title="Continuity &amp; handoffs">
          <div className="flex flex-col divide-y divide-hairline">
            {data.continuity.map((item) => (
              <Link
                key={item.studentId}
                href={`/school-v2/students/${item.studentId}`}
                className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-surface-sunken"
              >
                <ArrowRightLeft className="mt-0.5 size-4 shrink-0 text-foreground-faint" aria-hidden />
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-foreground">{item.studentName}</p>
                  <p className="mt-0.5 text-[13px] text-foreground-faint">
                    {item.priorInstructorName} &rarr; {item.currentInstructorName}
                  </p>
                  <p className="mt-1 text-[14px] text-foreground-soft">{item.themeSummary}</p>
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {data.studentsToWatch.length > 0 ? (
        <SectionCard title="Students to watch">
          <div className="flex flex-col divide-y divide-hairline">
            {data.studentsToWatch.map((item) => (
              <Link
                key={item.studentId}
                href={item.href}
                className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-surface-sunken"
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-foreground">
                    {item.studentName} <span className="font-normal text-foreground-faint">· with {item.instructorName}</span>
                  </p>
                  <p className="mt-0.5 text-[14px] text-foreground-soft">{item.detail}</p>
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
