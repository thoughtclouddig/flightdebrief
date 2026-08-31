import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";
import type { RecurringTheme } from "@/lib/training-memory";
import { recurringThemeSummary } from "@/lib/training-memory";

/**
 * A skill that keeps coming back, shown as its own history.
 *
 * The unit of analysis is the SKILL. Instructor names appear as timeline
 * context -- which lesson was whose -- and nowhere else: no per-instructor
 * column, no counts beside a name, no ordering that invites comparison. A
 * rollup keyed by instructor is a CFI scorecard, and a CFI who thinks the
 * tool grades them stops recording debriefs, which ends the capture the rest
 * of the product depends on.
 *
 * The copy carries the same rule. "Has come up in 3 lessons with 2
 * instructors" states persistence. It never says anyone failed to fix it.
 */
export function RecurrenceTimeline({ theme }: { theme: RecurringTheme }) {
  return (
    <Card className="border-amber/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-4 text-amber" />
          Still showing up
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-foreground">{recurringThemeSummary(theme)}</p>

        <ol className="flex flex-col gap-2.5 border-l border-hairline pl-3.5">
          {theme.lessons.map((lesson) => (
            <li key={lesson.flightId} className="relative">
              <span className="absolute -left-[18px] top-1.5 size-1.5 rounded-full bg-amber" />
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">
                {formatLessonDate(lesson.flightDate)}
                {lesson.instructorName ? ` · ${lesson.instructorName}` : ""}
              </p>
              <p className="mt-0.5 text-sm text-foreground-soft">{lesson.statement}</p>
            </li>
          ))}
        </ol>

        {theme.instructorCount >= 2 ? (
          <p className="rounded-lg bg-surface-sunken px-3 py-2 text-sm text-foreground-soft">
            This has stayed unresolved across a change of instructor, so it&rsquo;s worth treating as the skill itself
            rather than anything about how it was taught.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatLessonDate(flightDate: string): string {
  return new Date(flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
