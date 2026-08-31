import { Card, CardContent } from "@/components/ui/card";
import type { PerceptionGapRow } from "@/lib/perception-gap";

/**
 * The student/instructor comparison, presented as two perspectives rather
 * than a scoreboard.
 *
 * The previous table put "Student | Instructor | SIGNIFICANT DISAGREEMENT"
 * in three columns, which reads as a verdict on whoever was further from the
 * truth. Nothing about the comparison changed -- lib/debrief-cards/discrepancy.ts
 * still computes it the same way -- but a gap is information about the lesson,
 * not a finding against a person, and the layout now says so.
 */
export function PerceptionGapList({ rows }: { rows: PerceptionGapRow[] }) {
  if (rows.length === 0) return null;

  // Differences first. Agreement is reassuring but it is not what the student
  // came here to read, and burying the one gap under six matches is how a
  // debrief tool becomes a report nobody scrolls.
  const ordered = [...rows].sort((a, b) => severity(b.status) - severity(a.status));

  return (
    <div className="flex flex-col gap-3">
      {ordered.map((row) => (
        <Card key={row.taskLabel} className={row.status === "significant" ? "border-amber/40" : undefined}>
          <CardContent className="flex flex-col gap-3 py-4">
            <p className="text-sm font-semibold text-foreground">{row.taskLabel}</p>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-4">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">How you saw it</p>
                <p className="mt-1 text-sm text-foreground-soft">{row.studentView}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">
                  How your instructor saw it
                </p>
                <p className="mt-1 text-sm text-foreground-soft">{row.instructorView}</p>
              </div>
            </div>

            {row.interpretation ? (
              <div className="rounded-lg bg-surface-sunken px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">
                  Where your views differ
                </p>
                <p className="mt-1 text-sm text-foreground-soft">{row.interpretation}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function severity(status: PerceptionGapRow["status"]): number {
  return status === "significant" ? 2 : status === "minor" ? 1 : 0;
}
