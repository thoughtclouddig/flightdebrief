import Link from "next/link";
import { BarChart3, ClipboardList, Repeat, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcsBadge } from "@/components/acs-badge";
import { InfoTooltip } from "@/components/info-tooltip";
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
        <h1 className="text-2xl font-semibold text-foreground">Training Insights</h1>
        <p className="mt-1 text-sm text-foreground-soft">
          Patterns worth a look -- not verdicts. A chief instructor makes the call.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-4 text-brand" />
            Most Common Training Issues
            <InfoTooltip text="Skills currently marked as needing coaching for the most students, based on each student's most recent debrief." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {common.length === 0 ? (
            <p className="text-sm text-foreground-faint">No issues currently outstanding.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {common.slice(0, 8).map((issue) => (
                <li key={issue.skill} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    {issue.label}
                    <AcsBadge skill={issue.skill} certificateType="PRIVATE" />
                  </span>
                  <span className="shrink-0 font-medium text-foreground-soft">
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
            <InfoTooltip text="A student whose same skill has needed coaching in 3 or more of their last 4 debriefs -- not a one-off, but a pattern worth a look." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recurring.length === 0 ? (
            <p className="text-sm text-foreground-faint">No student has the same deficiency across 3+ recent debriefs.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {recurring.slice(0, 8).map((r) => (
                <li key={`${r.student.id}-${r.skill}`}>
                  <Link
                    href={`/admin/students/${r.student.id}`}
                    className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-sunken"
                  >
                    <span className="flex items-center gap-2 text-foreground">
                      {r.student.name}
                      <AcsBadge skill={r.skill} certificateType="PRIVATE" />
                    </span>
                    <span className="shrink-0 font-medium text-foreground-soft">
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
            <InfoTooltip text="An action item from a debrief that keeps showing up again in later debriefs without being resolved -- carried forward across 3 or more consecutive lessons." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {carried.length === 0 ? (
            <p className="text-sm text-foreground-faint">No open objective has carried across 3+ consecutive lessons.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {carried.slice(0, 8).map((c, i) => (
                <li key={`${c.student.id}-${i}`}>
                  <Link
                    href={`/admin/students/${c.student.id}`}
                    className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-sunken"
                  >
                    <span className="text-foreground">
                      {c.student.name} <span className="text-foreground-faint">&mdash;</span> &ldquo;{c.description}&rdquo;
                    </span>
                    <span className="shrink-0 font-medium text-foreground-soft">{c.streak} lessons</span>
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
            Training Coverage
            <InfoTooltip text="How often each skill has come up across all training in the last 60 days -- a raw activity count, not a measure of syllabus or FAA compliance." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {coverage.length === 0 ? (
            <p className="text-sm text-foreground-faint">No training activity in the last 60 days.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {coverage.map((c) => (
                <Badge key={c.skill} variant="neutral">
                  {c.label} · {c.occurrences}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground-soft">
          <Search className="size-4 text-brand" />
          Needs Review
        </h2>
        {needsReview.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hairline p-8 text-center text-sm text-foreground-soft">
            Nothing needs review right now.
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
