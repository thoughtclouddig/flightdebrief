import Link from "next/link";
import {
  BookOpen,
  CalendarClock,
  CheckSquare,
  ClipboardList,
  ExternalLink,
  History,
  PlaneTakeoff,
  Radio,
  Sparkles,
} from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import { LocalDateTime } from "@/components/local-date-time";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { computeDebriefProgress } from "@/lib/debrief-progress";
import { computeDebriefStreak, computeTotalCaptured } from "@/lib/milestones";
import { suggestStudyReferences } from "@/lib/topics";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";
import { formatDurationShort, formatFlightContext } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const dayLabel = isToday
    ? "Today"
    : d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const timeLabel = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${dayLabel} · ${timeLabel}`;
}

export default async function StudentHomePage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const studentId = viewer.user.id;

  const [flights, trainingItems, brief, radioPractice, milestones] = await Promise.all([
    repo.listFlights({ studentId }),
    repo.listTrainingItems(),
    computeNextLessonBrief(repo, studentId),
    repo.listRadioPracticeAssignments(studentId),
    repo.listMilestones(studentId),
  ]);
  const pendingRadioPractice = radioPractice.filter((a) => a.status === "assigned");

  const debriefedFlights = flights.filter((f) => f.debriefStatus === "complete");
  const recentDebriefs = debriefedFlights.slice(0, 3);
  const flightIds = new Set(flights.map((f) => f.id));
  const openActionItems = trainingItems.filter(
    (t) => flightIds.has(t.flightId) && !t.done && t.category !== "todo" && t.visibility === "shared",
  );

  // Rewards Phase 1: a compact, non-clickable summary -- there's no My
  // Journey destination to link into yet (that's Phase 2), and a dead-end
  // link would be worse than no link. Deliberately understated relative to
  // the hero cards above it -- see lib/milestones.ts for what counts.
  const totalCaptured = computeTotalCaptured(flights);
  const debriefStreak = computeDebriefStreak([...flights].sort((a, b) => b.flightDate.localeCompare(a.flightDate)));
  const rewardsStats =
    totalCaptured > 0
      ? [
          { value: totalCaptured, label: "Captured", color: "var(--brand)" },
          { value: debriefStreak, label: "Streak", color: "var(--good)" },
          { value: milestones.length, label: milestones.length === 1 ? "Badge" : "Badges", color: "var(--amber)" },
        ]
      : null;

  // The most recent flight that isn't debriefed yet, if any -- invisible to
  // brief.lastFlight (pre-filtered to complete-only, lib/training-memory.ts)
  // and the source of a real gap: neither dashboard showed a flight was
  // sitting mid-debrief at all. See lib/debrief-progress.ts.
  const pendingFlight = [...flights]
    .filter((f) => f.debriefStatus !== "complete")
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate))[0] ?? null;
  const pendingProgress = pendingFlight ? await computeDebriefProgress(repo, pendingFlight) : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="text-sm text-foreground-soft">Welcome back,</p>
        <h1 className="text-2xl font-semibold text-foreground">{viewer.user.name.split(" ")[0]}</h1>
      </div>

      {rewardsStats ? (
        <Card>
          <CardContent className="flex flex-col gap-3 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">
              Your training at a glance
            </p>
            <div className="grid grid-cols-3 gap-1">
              {rewardsStats.map((stat, i) => (
                <div
                  key={stat.label}
                  className={
                    i > 0
                      ? "flex flex-col items-center gap-1.5 border-l border-hairline py-1"
                      : "flex flex-col items-center gap-1.5 py-1"
                  }
                >
                  <div className="relative size-16">
                    <svg viewBox="0 0 64 64" className="-rotate-90">
                      <circle cx="32" cy="32" r="26" fill="none" stroke="var(--hairline)" strokeWidth="6" />
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        fill="none"
                        stroke={stat.color}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray="163"
                        strokeDashoffset="40"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-foreground">
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">{stat.label}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-foreground-soft">
              Captured and Streak count your debriefed flights; Badges mark automatic milestones like your first 5 or 10 debriefs -- not training milestones like solo or checkride.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {brief.upcomingReservation ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-4 text-brand" />
              Next Flight
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="font-medium text-foreground">
                <LocalDateTime
                  iso={brief.upcomingReservation.scheduledStart}
                  options={{ weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }}
                />
              </p>
              <p className="text-sm text-foreground-soft">
                Instructor: {brief.upcomingReservationInstructor?.name ?? "TBD"}
              </p>
            </div>

            {brief.keepWorkingOn.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">Focus from last lesson</p>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {brief.keepWorkingOn.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground-soft">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {brief.beforeFlightItems.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">Before you fly</p>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {brief.beforeFlightItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground-soft">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Link href="/next-lesson" className={buttonVariants({ size: "sm" })}>
              View full brief
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {pendingFlight && pendingProgress ? (
        <Link href={`/flights/${pendingFlight.id}/debrief`} className="block">
          {/* This is the only place on the page that goes stale while someone
              else is expected to act (the instructor finishing up, mainly) --
              a longer interval than the narrower single-purpose waiting
              screens elsewhere, since this refreshes the whole dashboard. */}
          <AutoRefresh intervalMs={15000} />
          <Card className="transition-colors hover:bg-surface-sunken">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlaneTakeoff className="size-4 text-brand" />
                {pendingProgress.stage === "awaiting_student_assessment" ? "Needs Your Input" : "Debrief In Progress"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-foreground">{formatFlightContext(pendingFlight)}</p>
                <p className="text-sm text-foreground-soft">
                  {pendingProgress.stage === "awaiting_tasks" || pendingProgress.stage === "awaiting_instructor_assessment"
                    ? "Waiting on your instructor."
                    : pendingProgress.stage === "awaiting_student_assessment"
                      ? "Your instructor submitted their assessment -- your turn."
                      : pendingProgress.stage === "awaiting_finish"
                        ? "Recorded -- your instructor still needs to finish reviewing it with you."
                        : "Both assessments are in -- your instructor is starting the debrief."}
                </p>
              </div>
              {pendingProgress.stage === "awaiting_student_assessment" ? (
                <span className={buttonVariants({ size: "sm" })}>Do it now</span>
              ) : null}
            </CardContent>
          </Card>
        </Link>
      ) : null}

      {brief.lastFlight ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlaneTakeoff className="size-4 text-brand" />
              Latest Flight
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-foreground">
                {brief.lastFlight.departureAirport} → {brief.lastFlight.arrivalAirport}
              </p>
              <p className="text-sm text-foreground-soft">
                {new Date(brief.lastFlight.flightDate + "T12:00:00").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                · {brief.lastFlight.aircraft.tailNumber} · {formatDurationShort(brief.lastFlight.durationMinutes)}
              </p>
            </div>
            <Link
              href={`/flights/${brief.lastFlight.id}/debrief/results`}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              View debrief
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <Link href="/progress" className="block">
        <Card className="transition-colors hover:bg-surface-sunken">
          <CardContent className="flex flex-col gap-1 py-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground-faint">
              <ClipboardList className="size-3.5" />
              Action items
            </p>
            <p className="text-2xl font-semibold text-foreground">{openActionItems.length}</p>
            <p className="text-xs text-foreground-soft">open · view progress →</p>
          </CardContent>
        </Card>
      </Link>

      {brief.focusAreas.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="size-4 text-brand" />
              Current Training Focus
              <span className="ml-auto flex items-center gap-1 text-xs font-normal text-foreground-faint">
                <Sparkles className="size-3.5" />
                {brief.focusAreas.length} for next lesson
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {brief.focusAreas.map((f, i) => {
              const reference = suggestStudyReferences([f])[0] ?? null;
              if (!reference) {
                return (
                  <Badge key={i} variant="neutral">
                    {f}
                  </Badge>
                );
              }
              return (
                <a
                  key={i}
                  href={reference.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-surface-sunken px-2.5 py-1 text-xs font-semibold text-foreground-soft transition-colors hover:text-brand"
                >
                  {f}
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {recentDebriefs.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="size-4 text-brand" />
              Recent Debriefs
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {recentDebriefs.map((flight) => (
              <Link
                key={flight.id}
                href={`/flights/${flight.id}/debrief/results`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 -mx-2 hover:bg-surface-sunken"
              >
                <div className="flex items-baseline gap-2.5">
                  <span className="text-sm text-foreground-soft">
                    {new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="text-sm text-foreground-faint">
                    {flight.departureAirport} → {flight.arrivalAirport}
                  </span>
                </div>
                <span className="text-sm text-foreground-faint">{flight.aircraft.tailNumber}</span>
              </Link>
            ))}
            <Link href="/history" className="text-sm font-medium text-brand hover:underline">
              View full training history →
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {pendingRadioPractice.length > 0 ? (
        <Card className="border-brand/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="size-4 text-brand" />
              Radio Practice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/practice/${pendingRadioPractice[0]!.id}`}
              className="-mx-2 flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface-sunken"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {RADIO_PRACTICE_SCENARIOS.find((s) => s.id === pendingRadioPractice[0]!.scenarioId)?.title ?? "Assigned practice"}
                </p>
                <p className="text-xs text-foreground-soft">
                  {pendingRadioPractice.length > 1 ? `${pendingRadioPractice.length} assigned -- tap to start this one →` : "Tap to practice this call →"}
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground-soft">
              <Radio className="size-4" />
              Radio Practice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground-faint">No radio-communications practice assigned yet.</p>
          </CardContent>
        </Card>
      )}

      {!brief.lastFlight && !brief.upcomingReservation && !pendingFlight ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-hairline p-10 text-center text-foreground-soft">
          <BookOpen className="size-8 text-foreground-faint" />
          No flights yet. Add your first training flight to get started.
          <Link href="/flights/new" className={buttonVariants({ size: "sm" })}>
            Add a flight
          </Link>
        </div>
      ) : null}
    </div>
  );
}
