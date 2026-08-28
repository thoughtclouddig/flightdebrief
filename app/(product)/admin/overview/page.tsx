import { cn } from "@/lib/utils";
import { organizationKindLabel } from "@/lib/types";
import Link from "next/link";
import { Lightbulb, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AdminStat } from "@/components/admin-stat";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { formatDurationShort } from "@/lib/utils";
import { mostCommonIssues, needsReviewQueue } from "@/lib/training-insights";
import { computeSchoolFreeDebriefs } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const orgId = viewer.organization.id;

  const [students, instructors, flights, topIssues, needsReview] = await Promise.all([
    repo.listMembers(orgId, "student"),
    repo.listMembers(orgId, "instructor"),
    repo.listFlights({ organizationId: orgId }),
    mostCommonIssues(repo, orgId),
    needsReviewQueue(repo, orgId),
  ]);

  const activeStudents = students.filter((m) => m.status === "active").length;
  const activeInstructors = instructors.filter((m) => m.status === "active").length;

  const now = new Date();
  const flightsThisMonth = flights.filter((f) => {
    const d = new Date(f.flightDate + "T12:00:00");
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const debriefedCount = flights.filter((f) => f.debriefStatus === "complete").length;
  const debriefedPct = flights.length > 0 ? Math.round((debriefedCount / flights.length) * 100) : 0;
  const freeDebriefs = computeSchoolFreeDebriefs(flights);

  const recent = [...flights].sort((a, b) => b.flightDate.localeCompare(a.flightDate)).slice(0, 10);
  const rows = await Promise.all(
    recent.map(async (flight) => ({
      flight,
      student: await repo.getUser(flight.userId),
      debrief: await repo.getDebriefByFlight(flight.id),
    })),
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{viewer.organization.name}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{organizationKindLabel(viewer.organization.kind)}</p>
      </div>

      <div className={cn("grid grid-cols-2 gap-4", viewer.organization.kind === "independent_cfi" ? "sm:grid-cols-3" : "sm:grid-cols-4")}>
        <AdminStat label="Active Students" value={activeStudents} />
        {/* An independent CFI is the only instructor, so this tile can only
            ever say "1" -- and it's counting the person reading it. */}
        {viewer.organization.kind === "independent_cfi" ? null : (
          <AdminStat label="CFIs" value={activeInstructors} />
        )}
        <AdminStat label="Flights This Month" value={flightsThisMonth.length} />
        <AdminStat label="Debriefs Completed" value={`${debriefedPct}%`} />
      </div>

      {viewer.organization.kind === "school" ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Ticket className="mt-0.5 size-5 shrink-0 text-brand" />
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                {freeDebriefs.used} of {freeDebriefs.cap} free debriefs used
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {freeDebriefs.exhausted
                  ? "Your school's free debriefs are used up."
                  : `${freeDebriefs.remaining} free debrief${freeDebriefs.remaining === 1 ? "" : "s"} remaining.`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-brand" />
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Training Insights</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {topIssues[0]
                  ? `Top issue right now: ${topIssues[0].label} (${topIssues[0].studentCount} student${topIssues[0].studentCount === 1 ? "" : "s"})`
                  : "No recurring issues yet"}
                {needsReview.length > 0 ? ` · ${needsReview.length} item${needsReview.length === 1 ? "" : "s"} for review` : ""}
              </p>
            </div>
          </div>
          <Link href="/admin/insights" className="shrink-0 text-sm font-medium text-brand hover:underline">
            View insights →
          </Link>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Recent Training Activity</h2>
        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
            No flights yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-hairline">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                <tr>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Student</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">CFI</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Aircraft</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Flight</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Debrief</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Next Focus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {rows.map(({ flight, student, debrief }) => (
                  <tr key={flight.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-900 dark:text-white">{student?.name}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-600 dark:text-slate-300">{flight.instructor?.name ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-600 dark:text-slate-300">{flight.aircraft.tailNumber}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-600 dark:text-slate-300">
                      {new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
                      {formatDurationShort(flight.durationMinutes)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <Badge variant={flight.debriefStatus === "complete" ? "success" : "warning"}>
                        {flight.debriefStatus === "complete" ? "Complete" : "Pending"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                      {debrief?.structuredResult.nextLessonFocus.slice(0, 1).join("") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
