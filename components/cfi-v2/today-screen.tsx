import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Screen, Section } from "@/components/student/ui";
import { LocalDateTime } from "@/components/local-date-time";
import { AutoRefresh } from "@/components/auto-refresh";
import type { CfiV2Today } from "@/lib/cfi-v2/today";

const TIME_ONLY: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
const DAY_AND_TIME: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

/**
 * CFI V2's Today: Needs You Now, Today's Schedule, This Week -- see
 * lib/cfi-v2/today.ts for how the first section unifies V1's separate
 * "Debrief In Progress" and "Students Needing Attention" lists.
 */
export function CfiV2TodayScreen({ data }: { data: CfiV2Today }) {
  return (
    <Screen>
      <AutoRefresh intervalMs={20000} />

      <div>
        <h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground">Today</h1>
        <p className="mt-1 text-[15px] text-foreground-soft">Who you&rsquo;re flying with, and where you left off.</p>
      </div>

      {data.needsYouNow.length > 0 ? (
        <Section title="Needs you now">
          <div className="flex flex-col divide-y divide-hairline">
            {data.needsYouNow.map((item) => (
              <div key={item.studentId} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href={`/cfi-v2/students/${item.studentId}`}
                    className="text-[15px] font-semibold text-foreground hover:text-brand"
                  >
                    {item.studentName}
                  </Link>
                  <Link href={item.actionHref} className="shrink-0 text-[14px] font-semibold text-brand">
                    {item.actionLabel} &rarr;
                  </Link>
                </div>
                <p className="text-[14px] text-foreground-soft">
                  {item.reason}
                  {item.flightContext ? ` · ${item.flightContext}` : ""}
                </p>
                {item.otherInstructorName ? (
                  <p className="text-[13px] text-foreground-faint">Flown with {item.otherInstructorName}</p>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      <Section title="Today's schedule">
        {data.todaysSchedule.length === 0 ? (
          <p className="py-1 text-[15px] text-foreground-faint">No lessons scheduled today.</p>
        ) : (
          <div className="flex flex-col divide-y divide-hairline">
            {data.todaysSchedule.map((lesson) => (
              <div key={lesson.reservationId} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[15px] font-semibold text-foreground">{lesson.studentName}</p>
                  <span className="shrink-0 text-[14px] font-medium text-foreground-faint">
                    <LocalDateTime iso={lesson.scheduledStart} options={TIME_ONLY} />
                  </span>
                </div>
                <p className="text-[14px] text-foreground-faint">
                  {lesson.tailNumber} · {lesson.aircraftType}
                </p>
                {lesson.currentFocus.length > 0 ? (
                  <ul className="flex flex-col gap-1">
                    {lesson.currentFocus.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-[14px] text-foreground-soft">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand" />
                        {f}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <Link href={lesson.actionHref} className="self-start text-[14px] font-semibold text-brand">
                  {lesson.actionLabel} &rarr;
                </Link>
              </div>
            ))}
          </div>
        )}
      </Section>

      {data.thisWeek.length > 0 ? (
        <details className="group overflow-hidden rounded-2xl border border-hairline bg-surface px-5 py-4">
          <summary className="cursor-pointer text-[14px] font-bold uppercase tracking-[0.08em] text-foreground-soft">
            This week ({data.thisWeek.length})
          </summary>
          <div className="mt-3 flex flex-col divide-y divide-hairline">
            {data.thisWeek.map((lesson) => (
              <Link
                key={lesson.reservationId}
                href={`/cfi-v2/students/${lesson.studentId}`}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span className="text-[15px] text-foreground">{lesson.studentName}</span>
                <span className="text-[13px] text-foreground-faint">
                  <LocalDateTime iso={lesson.scheduledStart} options={DAY_AND_TIME} />
                </span>
              </Link>
            ))}
          </div>
        </details>
      ) : null}

      {data.isAllCaughtUp ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-foreground-faint">
          <CalendarClock className="size-8" aria-hidden />
          <p className="text-[15px]">All caught up. Nothing scheduled and no open items.</p>
        </div>
      ) : null}
    </Screen>
  );
}
