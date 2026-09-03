import Link from "next/link";
import { BookOpen, ExternalLink } from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import { LocalDateTime } from "@/components/local-date-time";
import { buttonVariants } from "@/components/ui/button";
import {
  Panel,
  PanelButton,
  PanelEyebrow,
  PanelHeadline,
  PanelMeta,
  PrimaryButton,
  QuietRow,
  Screen,
  Section,
} from "@/components/prototype/ui";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { computeDebriefProgress } from "@/lib/debrief-progress";
import { computeDebriefStreak, computeTotalCaptured } from "@/lib/milestones";
import { suggestStudyReferences } from "@/lib/topics";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";
import { RadioPracticeCard } from "@/components/radio-practice-card";
import { formatDurationShort, formatFlightContext } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentHomePage() {
  const repo = getRepository();
  const viewer = await getViewer();
  /** No CFI on the account at all -- see lib/auth/store.ts createOrganization. */
  const solo = viewer.organization.kind === "individual";
  const studentId = viewer.user.id;

  const [flights, trainingItems, brief, radioPractice, milestones] = await Promise.all([
    repo.listFlights({ studentId }),
    repo.listTrainingItems(),
    computeNextLessonBrief(repo, studentId),
    repo.listRadioPracticeAssignments(studentId),
    repo.listMilestones(studentId),
  ]);
  const pendingRadioPractice = radioPractice.filter((a) => a.status === "assigned");
  // Completed calls stay reachable. Finishing every assignment used to empty
  // the card back to "none assigned yet", which reads as though the work
  // vanished -- and the calls a student got wrong are exactly the ones worth
  // going back to.
  const completedRadioPractice = radioPractice
    .filter((a) => a.status === "completed")
    .slice(0, 5);

  const scenarioTitle = (scenarioId: string) =>
    RADIO_PRACTICE_SCENARIOS.find((s) => s.id === scenarioId)?.title ?? "Radio call";

  const debriefedFlights = flights.filter((f) => f.debriefStatus === "complete");
  const recentDebriefs = debriefedFlights.slice(0, 3);
  const flightIds = new Set(flights.map((f) => f.id));
  const openActionItems = trainingItems.filter(
    (t) => flightIds.has(t.flightId) && !t.done && t.category !== "todo" && t.visibility === "shared",
  );

  // Rewards Phase 1: a compact, non-clickable summary -- there's no My
  // Journey destination to link into yet (that's Phase 2). See
  // lib/milestones.ts for what counts. Rendered as plain numerals, not the
  // circular gauges the previous layout used -- MASTER.md's progress
  // language (SS9/SS16) explicitly rejects a ring/gauge implying a
  // readiness percentage that was never computed; these are counts.
  const totalCaptured = computeTotalCaptured(flights);
  const debriefStreak = computeDebriefStreak([...flights].sort((a, b) => b.flightDate.localeCompare(a.flightDate)));
  const rewardsStats =
    totalCaptured > 0
      ? [
          { value: totalCaptured, label: "Captured" },
          { value: debriefStreak, label: "Streak" },
          { value: milestones.length, label: milestones.length === 1 ? "Badge" : "Badges" },
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

  // One Panel per screen (MASTER.md's "ONE PANEL" rule) -- picked by what's
  // most actionable right now: an undebriefed flight outranks a scheduled
  // one, which outranks just recapping the last completed flight.
  const panelMode = pendingFlight && pendingProgress ? "pending" : brief.upcomingReservation ? "next" : brief.lastFlight ? "last" : "none";

  return (
    <Screen>
      <p className="text-[15px] text-foreground-faint">
        Welcome back, <span className="font-medium text-foreground">{viewer.user.name.split(" ")[0]}</span>
      </p>

      {/* 1. Next-flight focus -- what to work on before you fly again. */}
      {panelMode === "pending" && pendingFlight && pendingProgress ? (
        <>
          {solo ? null : <AutoRefresh intervalMs={15000} />}
          <Panel>
            <PanelEyebrow>
              {solo ? "Ready to debrief" : pendingProgress.stage === "awaiting_student_assessment" ? "Needs your input" : "Debrief in progress"}
            </PanelEyebrow>
            <PanelHeadline>{formatFlightContext(pendingFlight)}</PanelHeadline>
            <PanelMeta>
              {solo
                ? "Talk through this one whenever you're ready."
                : pendingProgress.stage === "awaiting_tasks" || pendingProgress.stage === "awaiting_instructor_assessment"
                  ? "Waiting on your instructor."
                  : pendingProgress.stage === "awaiting_student_assessment"
                    ? "Your instructor submitted their assessment -- your turn."
                    : pendingProgress.stage === "awaiting_finish"
                      ? "Recorded -- your instructor still needs to finish reviewing it with you."
                      : "Both assessments are in -- your instructor is starting the debrief."}
            </PanelMeta>
            <div className="mt-5">
              <PanelButton href={`/flights/${pendingFlight.id}/debrief`}>
                {solo ? "Start" : pendingProgress.stage === "awaiting_student_assessment" ? "Do it now" : "Open"}
              </PanelButton>
            </div>
          </Panel>
        </>
      ) : panelMode === "next" && brief.upcomingReservation ? (
        <Panel>
          <PanelEyebrow>Next flight</PanelEyebrow>
          <PanelHeadline>
            <LocalDateTime
              iso={brief.upcomingReservation.scheduledStart}
              options={{ weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }}
            />
          </PanelHeadline>
          <PanelMeta>Instructor: {brief.upcomingReservationInstructor?.name ?? "TBD"}</PanelMeta>
          {brief.keepWorkingOn.length > 0 ? (
            <div className="mt-4">
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-panel-foreground-soft">
                Focus from last lesson
              </p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {brief.keepWorkingOn.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[15px] text-panel-foreground">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-5">
            <PanelButton href="/next-lesson">View full brief</PanelButton>
          </div>
        </Panel>
      ) : panelMode === "last" && brief.lastFlight ? (
        <Panel>
          <PanelEyebrow>Latest flight</PanelEyebrow>
          <PanelHeadline>
            {brief.lastFlight.departureAirport} → {brief.lastFlight.arrivalAirport}
          </PanelHeadline>
          <PanelMeta>
            {new Date(brief.lastFlight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {" · "}
            {brief.lastFlight.aircraft.tailNumber} · {formatDurationShort(brief.lastFlight.durationMinutes)}
          </PanelMeta>
          <div className="mt-5">
            <PanelButton href={`/flights/${brief.lastFlight.id}/debrief/results`}>View debrief</PanelButton>
          </div>
        </Panel>
      ) : null}

      {/* 2. What came out of the latest debrief. */}
      {brief.lastFlight && brief.lastWentWell.length > 0 ? (
        <Section title="From your latest debrief">
          <ul className="flex flex-col gap-2">
            {brief.lastWentWell.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[15px] leading-relaxed text-foreground-soft">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-state-good" />
                {item}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* 3. What needs work. */}
      {brief.focusAreas.length > 0 ? (
        <Section title="What needs work">
          <div className="flex flex-wrap gap-1.5">
            {brief.focusAreas.map((f, i) => {
              const reference = suggestStudyReferences([f])[0] ?? null;
              return reference ? (
                <a
                  key={i}
                  href={reference.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-surface-sunken px-2.5 py-1 text-[13px] font-semibold text-foreground-soft transition-colors hover:text-brand"
                >
                  {f}
                  <ExternalLink className="size-3 shrink-0" aria-hidden />
                </a>
              ) : (
                <span key={i} className="rounded-md bg-surface-sunken px-2.5 py-1 text-[13px] font-semibold text-foreground-soft">
                  {f}
                </span>
              );
            })}
          </div>
        </Section>
      ) : null}

      {/* 4. Preparation between flights. */}
      {brief.beforeFlightItems.length > 0 || pendingRadioPractice.length > 0 || completedRadioPractice.length > 0 ? (
        <Section title="Between flights">
          <div className="flex flex-col gap-4">
            {brief.beforeFlightItems.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {brief.beforeFlightItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[15px] leading-relaxed text-foreground-soft">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
            <RadioPracticeCard
              assigned={pendingRadioPractice.map((a) => ({ id: a.id, title: scenarioTitle(a.scenarioId) }))}
              practiced={completedRadioPractice.map((a) => ({
                id: a.id,
                title: scenarioTitle(a.scenarioId),
                correct: a.correct ?? false,
              }))}
            />
            <PrimaryButton href="/next-lesson">Open next-lesson brief</PrimaryButton>
          </div>
        </Section>
      ) : null}

      {/* 5. Progress. */}
      <Section title="Progress" action={<Link href="/progress" className="text-[15px] font-medium text-brand hover:underline">See all →</Link>}>
        <div className="flex flex-col gap-4">
          <QuietRow href="/progress" label="Open action items" meta={openActionItems.length} />
          {rewardsStats ? (
            <div className="flex gap-6 border-t border-hairline pt-3">
              {rewardsStats.map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-[22px] font-semibold tabular-nums text-foreground">{stat.value}</span>
                  <span className="text-[13px] text-foreground-faint">{stat.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </Section>

      {recentDebriefs.length > 0 ? (
        <Section title="Recent debriefs" flush>
          <div className="overflow-hidden rounded-2xl border border-hairline bg-surface px-5">
            {recentDebriefs.map((flight) => (
              <QuietRow
                key={flight.id}
                href={`/flights/${flight.id}/debrief/results`}
                label={`${flight.departureAirport} → ${flight.arrivalAirport}`}
                meta={new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              />
            ))}
          </div>
          <Link href="/history" className="px-1.5 text-[15px] font-medium text-brand hover:underline">
            View full training history →
          </Link>
        </Section>
      ) : null}

      {!brief.lastFlight && !brief.upcomingReservation && !pendingFlight ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-hairline p-10 text-center text-foreground-soft">
          <BookOpen className="size-8 text-foreground-faint" aria-hidden />
          No flights yet. Add your first training flight to get started.
          <Link href="/flights/new" className={buttonVariants({ size: "sm" })}>
            Add a flight
          </Link>
        </div>
      ) : null}
    </Screen>
  );
}
