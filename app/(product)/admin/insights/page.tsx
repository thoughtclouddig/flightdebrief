import { BarChart3, ClipboardList, Repeat, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcsBadge } from "@/components/acs-badge";
import { InsightStatCard } from "@/components/insight-stat-card";
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

  const recurringStudentCount = new Set(recurring.map((r) => r.student.id)).size;
  const carriedStudentCount = new Set(carried.map((c) => c.student.id)).size;

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

      <InsightStatCard
        icon={Repeat}
        iconClassName="text-amber-500"
        title="Recurring Student Issues"
        value={recurringStudentCount}
        description={`student${recurringStudentCount === 1 ? "" : "s"} have the same deficiency appearing in 3+ recent debriefs.`}
        linkLabel="View Students"
        href="/admin/students"
      />

      <InsightStatCard
        icon={ClipboardList}
        title="Objectives Being Carried Forward"
        value={carriedStudentCount}
        description={`student${carriedStudentCount === 1 ? "" : "s"} have training objectives carried forward across 3+ lessons.`}
        linkLabel="Review"
        href="/admin/students"
      />

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
          <p className="mt-3 text-xs text-slate-400">
            Skills that have come up in recent training -- not a measure of syllabus or FAA compliance.
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
