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
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { suggestStudyReferences } from "@/lib/topics";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";
import { formatDurationShort } from "@/lib/utils";

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

  const [flights, trainingItems, brief, radioPractice] = await Promise.all([
    repo.listFlights({ studentId }),
    repo.listTrainingItems(),
    computeNextLessonBrief(repo, studentId),
    repo.listRadioPracticeAssignments(studentId),
  ]);
  const pendingRadioPractice = radioPractice.filter((a) => a.status === "assigned");

  const debriefedFlights = flights.filter((f) => f.debriefStatus === "complete");
  const recentDebriefs = debriefedFlights.slice(0, 3);
  const flightIds = new Set(flights.map((f) => f.id));
  const openActionItems = trainingItems.filter(
    (t) => flightIds.has(t.flightId) && !t.done && t.category !== "todo" && t.visibility === "shared",
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="text-sm text-foreground-soft">Welcome back,</p>
        <h1 className="text-2xl font-semibold text-foreground">{viewer.user.name.split(" ")[0]}</h1>
      </div>

      {brief.upcomingReservation ? (
        <Card className="border-brand/30 bg-brand/5 dark:bg-brand/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-4 text-brand" />
              Next Flight
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="font-medium text-foreground">
                {formatDateTime(brief.upcomingReservation.scheduledStart)}
              </p>
              <p className="text-sm text-foreground-soft">
                Instructor: {brief.lastInstructor?.name ?? "TBD"}
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
              const reference = suggestStudyReferences(f)[0] ?? null;
              if (!reference) {
                return (
                  <Badge key={i} variant="brand">
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
                  className="inline-flex items-center gap-1 rounded-md bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand-dark hover:bg-brand/20 dark:bg-brand/20 dark:text-brand-light dark:hover:bg-brand/30"
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

      {!brief.lastFlight && !brief.upcomingReservation ? (
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
