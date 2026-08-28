import Link from "next/link";
import { BarChart3, ClipboardList, Repeat, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsightBars } from "@/components/admin/insight-bars";
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
            <InsightBars
              data={common.slice(0, 8).map((issue) => ({
                key: issue.skill,
                label: issue.label,
                value: issue.studentCount,
                valueLabel: `${issue.studentCount} student${issue.studentCount === 1 ? "" : "s"}`,
                adornment: <AcsBadge skill={issue.skill} certificateType="PRIVATE" />,
              }))}
            />
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
                    <span className="min-w-0 text-foreground">
                      {c.student.name} <span className="text-foreground-faint">&mdash;</span> &ldquo;{c.description}&rdquo;
                      {/* Who last flew it. A chief instructor's lever here is the
                          CFI, not the objective, so naming them is the point of
                          the row. */}
                      {c.instructorName ? (
                        <span className="text-foreground-faint"> &middot; with {c.instructorName}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 whitespace-nowrap font-medium text-foreground-soft">{c.streak} lessons</span>
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
            <InsightBars
              data={[...coverage]
                .sort((a, b) => b.occurrences - a.occurrences)
                .map((c) => ({ key: c.skill, label: c.label, value: c.occurrences }))}
            />
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground-soft">
          <Search className="size-4 text-brand" />
          Needs Review
        </h2>
        {needsReview.length === 0 ? (
          <div className="rounded-lg border border-dashed border-hairline p-8 text-center text-sm text-foreground-soft">
            Nothing needs review right now.
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col gap-3">
              {/* /admin, not /cfi: app/(product)/cfi/layout.tsx 404s anyone whose
                  role isn't instructor, and only admins reach this page -- so the
                  CFI link this used to point at was a guaranteed 404. */}
              {needsReview.map((entry, i) => (
                <NeedsReviewRow
                  key={i}
                  studentName={entry.student.name}
                  detail={entry.detail}
                  reason={entry.reason}
                  href={`/admin/students/${entry.student.id}`}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
