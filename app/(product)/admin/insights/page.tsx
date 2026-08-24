import Link from "next/link";
import { BarChart3, ClipboardList, Repeat, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcsBadge } from "@/components/acs-badge";
import { NeedsReviewRow } from "@/components/needs-review-row";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import {
  mostCommonIssues,
  needsReviewQueue,
  objectivesCarriedForward,
  recurringStudentIssues,
  trainingCoverage,
} from "@/lib/training-insights";

export const dynamic = "force-dynamic";

export default async function AdminInsightsPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const orgId = viewer.organization.id;

  const [common, recurring, carried, coverage, needsReview] = await Promise.all([
    mostCommonIssues(repo, orgId),
    recurringStudentIssues(repo, orgId),
    objectivesCarriedForward(repo, orgId),
    trainingCoverage(repo, orgId),
    needsReviewQueue(repo, orgId),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Training Insights</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Patterns worth a look -- not verdicts. A chief instructor makes the call.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-4 text-brand" />
            Most Common Training Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          {common.length === 0 ? (
            <p className="text-sm text-slate-400">No issues currently outstanding.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {common.slice(0, 8).map((issue) => (
                <li key={issue.skill} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    {issue.label}
                    <AcsBadge skill={issue.skill} certificateType="PRIVATE" />
                  </span>
                  <span className="shrink-0 font-medium text-slate-500 dark:text-slate-400">
                    {issue.studentCount} student{issue.studentCount === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="size-4 text-amber-500" />
            Recurring Student Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recurring.length === 0 ? (
            <p className="text-sm text-slate-400">No student has the same deficiency across 3+ recent debriefs.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {recurring.slice(0, 8).map((r) => (
                <li key={`${r.student.id}-${r.skill}`}>
                  <Link
                    href={`/admin/students/${r.student.id}`}
                    className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                      {r.student.name}
                      <AcsBadge skill={r.skill} certificateType="PRIVATE" />
                    </span>
                    <span className="shrink-0 font-medium text-slate-500 dark:text-slate-400">
                      {r.count} of last {r.consideredFlights} debriefs
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-4 text-brand" />
            Objectives Being Carried Forward
          </CardTitle>
        </CardHeader>
        <CardContent>
          {carried.length === 0 ? (
            <p className="text-sm text-slate-400">No open objective has carried across 3+ consecutive lessons.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {carried.slice(0, 8).map((c, i) => (
                <li key={`${c.student.id}-${i}`}>
                  <Link
                    href={`/admin/students/${c.student.id}`}
                    className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <span className="text-slate-700 dark:text-slate-200">
                      {c.student.name} <span className="text-slate-400">&mdash;</span> &ldquo;{c.description}&rdquo;
                    </span>
                    <span className="shrink-0 font-medium text-slate-500 dark:text-slate-400">{c.streak} lessons</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Training Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          {coverage.length === 0 ? (
            <p className="text-sm text-slate-400">No training activity in the last 60 days.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {coverage.map((c) => (
                <Badge key={c.skill} variant="neutral">
                  {c.label} · {c.occurrences}
                </Badge>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            How often each skill has come up in the last 60 days of debriefs -- not a syllabus or FAA compliance
            measure.
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <Search className="size-4 text-brand" />
          Needs Review
        </h2>
        {needsReview.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
            Nothing flagged for review right now.
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col gap-3">
              {needsReview.map((entry, i) => (
                <NeedsReviewRow
                  key={i}
                  studentName={entry.student.name}
                  detail={entry.detail}
                  reason={entry.reason}
                  href={`/cfi/students/${entry.student.id}`}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
