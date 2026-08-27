import Link from "next/link";
import { AlertTriangle, CalendarClock, PlaneTakeoff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CfiStudentCard } from "@/components/cfi-student-card";
import { AutoRefresh } from "@/components/auto-refresh";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { attentionReasons, computeInstructorRoster, computeNextLessonBrief } from "@/lib/training-memory";
import { computeDebriefProgress, debriefStageLabel } from "@/lib/debrief-progress";
import { localIsoDate } from "@/lib/date";
import { formatFlightContext, formatFlightDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatUpcomingDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · ${formatTime(iso)}`;
}

export default async function CfiTodayPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const instructorId = viewer.user.id;

  const [reservations, roster] = await Promise.all([
    repo.listReservations({ organizationId: viewer.organization.id, instructorId }),
    computeInstructorRoster(repo, instructorId, viewer.organization.id),
  ]);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const todaysReservations = reservations
    .filter((r) => {
      const t = new Date(r.scheduledStart).getTime();
      return r.status === "scheduled" && t >= startOfDay.getTime() && t <= endOfDay.getTime();
    })
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));

  const cards = await Promise.all(
    todaysReservations.map(async (reservation) => {
      const [student, aircraft, brief, studentFlights] = await Promise.all([
        repo.getUser(reservation.studentId),
        repo.getAircraft(reservation.aircraftId),
        computeNextLessonBrief(repo, reservation.studentId),
        repo.listFlights({ studentId: reservation.studentId }),
      ]);
      const todaysFlight = studentFlights.find(
        (f) => f.flightDate === localIsoDate() && f.debriefStatus !== "complete",
      );
      return { reservation, student, aircraft, brief, todaysFlight };
    }),
  );

  const upcomingWindowEnd = new Date(endOfDay.getTime() + 6 * 24 * 60 * 60 * 1000);
  const upcomingReservations = reservations
    .filter((r) => {
      const t = new Date(r.scheduledStart).getTime();
      return r.status === "scheduled" && t > endOfDay.getTime() && t <= upcomingWindowEnd.getTime();
    })
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));

  const upcomingCards = await Promise.all(
    upcomingReservations.map(async (reservation) => ({
      reservation,
      student: await repo.getUser(reservation.studentId),
      aircraft: await repo.getAircraft(reservation.aircraftId),
    })),
  );

  const rosterWithProgress = await Promise.all(
    roster.map(async (entry) => ({
      entry,
      progress: entry.pendingFlight ? await computeDebriefProgress(repo, entry.pendingFlight) : undefined,
    })),
  );

  // Split out anything actively moving through the debrief flow (tasks
  // already picked, at least one assessment in) into its own section so it
  // reads the same way the student's own "Debrief In Progress" home card
  // does -- otherwise this state was only visible as one generic badge
  // buried in "Needing Attention", easy to miss after a student submits.
  const debriefInProgress = rosterWithProgress.filter(
    ({ progress }) => progress && progress.stage !== "awaiting_tasks",
  );
  const needingAttention = rosterWithProgress
    .filter(({ progress }) => !progress || progress.stage === "awaiting_tasks")
    .map(({ entry, progress }) => ({ entry, reasons: attentionReasons(entry, progress) }))
    .filter(({ reasons }) => reasons.length > 0);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <AutoRefresh intervalMs={20000} />
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Today</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Who you&rsquo;re flying with, and where you left off.</p>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <CalendarClock className="size-4 text-brand" />
          Today&rsquo;s Students
        </h2>
        {cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
            No lessons scheduled today.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {cards.map(({ reservation, student, aircraft, brief, todaysFlight }) => (
              <CfiStudentCard
                key={reservation.id}
                studentName={student?.name ?? "—"}
                timeLabel={formatTime(reservation.scheduledStart)}
                tailNumber={aircraft?.tailNumber ?? "—"}
                aircraftType={aircraft?.type ?? "—"}
                focusAreas={brief.focusAreas}
                openBriefHref={todaysFlight ? `/flights/${todaysFlight.id}/debrief` : `/cfi/students/${student?.id}`}
                profileHref={`/cfi/students/${student?.id}`}
              />
            ))}
          </div>
        )}
      </div>

      {upcomingCards.length > 0 ? (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <CalendarClock className="size-4 text-foreground-faint" />
            Upcoming (next 7 days)
          </h2>
          <Card>
            <CardContent className="flex flex-col gap-3">
              {upcomingCards.map(({ reservation, student, aircraft }) => (
                <Link
                  key={reservation.id}
                  href={`/cfi/students/${student?.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{student?.name ?? "—"}</p>
                    <p className="text-xs text-slate-400">{aircraft?.tailNumber ?? "—"}</p>
                  </div>
                  <span className="text-xs font-medium text-foreground-faint">{formatUpcomingDateTime(reservation.scheduledStart)}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {debriefInProgress.length > 0 ? (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <PlaneTakeoff className="size-4 text-brand" />
            Debrief In Progress
          </h2>
          <Card>
            <CardContent className="flex flex-col gap-3">
              {debriefInProgress.map(({ entry, progress }) => (
                <Link
                  key={entry.student.id}
                  href={`/flights/${entry.pendingFlight!.id}/debrief`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{entry.student.name}</p>
                    <p className="text-xs text-slate-400">{formatFlightContext(entry.pendingFlight!)}</p>
                  </div>
                  <Badge variant="outline">{debriefStageLabel(progress!)}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {needingAttention.length > 0 ? (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <AlertTriangle className="size-4 text-amber-500" />
            Students Needing Attention
          </h2>
          <Card>
            <CardContent className="flex flex-col divide-y divide-hairline p-0">
              {needingAttention.map(({ entry, reasons }) => (
                <div key={entry.student.id} className="flex flex-col gap-1.5 px-4 py-3">
                  <Link
                    href={`/cfi/students/${entry.student.id}`}
                    className="text-sm font-medium text-slate-800 hover:underline dark:text-slate-100"
                  >
                    {entry.student.name}
                  </Link>
                  {/* Same org-scoped-not-instructor-scoped rule as the flight
                      detail page -- name the other CFI so a flight you didn't
                      instruct doesn't read as wrongly landing in your list. */}
                  {entry.pendingFlight?.instructor && entry.pendingFlight.instructor.id !== instructorId ? (
                    <p className="text-xs text-foreground-soft">Flown with {entry.pendingFlight.instructor.name}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-1">
                    {reasons.map((r, i) => {
                      // Each reason with a single obvious fix links straight to it --
                      // never the student's general profile page, which just makes the
                      // CFI go hunting for the actual thing to do.
                      const href =
                        r === "Debrief not started" && entry.pendingFlight
                          ? `/flights/${entry.pendingFlight.id}/debrief/tasks`
                          : r === "Next lesson has no objectives"
                            ? `/cfi/students/${entry.student.id}/handoff`
                            : r === "No flight scheduled"
                              ? `/cfi/students/${entry.student.id}#schedule-lesson`
                              : null;
                      // "Debrief not started" alone gives no sense of which flight or how
                      // stale it is -- the date is what actually tells a CFI whether this
                      // is today's flight or one that's been sitting for a week.
                      const label =
                        r === "Debrief not started" && entry.pendingFlight
                          ? `${r} · ${formatFlightDate(entry.pendingFlight.flightDate)}`
                          : r;
                      return href ? (
                        <Link key={i} href={href}>
                          <Badge variant="outline" className="transition-colors hover:bg-brand hover:text-white">
                            {label}
                          </Badge>
                        </Link>
                      ) : (
                        <Badge key={i} variant="outline">
                          {r}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {cards.length === 0 && upcomingCards.length === 0 && debriefInProgress.length === 0 && needingAttention.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-400">
          <PlaneTakeoff className="size-8" />
          <p className="text-sm">All caught up. Nothing scheduled and no open items.</p>
        </div>
      ) : null}
    </div>
  );
}
