import { ArrowRight, Mic, Plane } from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import { LocalDateTime } from "@/components/local-date-time";
import {
  Evidence,
  Panel,
  PanelButton,
  PanelEyebrow,
  PanelHeadline,
  PanelMeta,
  PrimaryButton,
  QuietRow,
  Screen,
  Section,
  SecondaryButton,
} from "@/components/prototype/ui";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { computeDebriefProgress } from "@/lib/debrief-progress";
import { computeDebriefStreak, computeTotalCaptured } from "@/lib/milestones";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { RADIO_PRACTICE_SCENARIOS } from "@/lib/radio-practice-scenarios";
import { RadioPracticeCard } from "@/components/radio-practice-card";
import { formatDurationShort, formatFlightContext } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Home -- Phase 4 rewrite. app/prototype/vector/page.tsx is the design
 * source: a state-aware screen with one Panel answering "what should I do
 * now", not a dashboard of equal cards.
 *
 * The prototype has three states (JustLanded/JustFlew/BetweenFlights).
 * JustLanded is not ported -- it depends on ADS-B "did you fly today, here's
 * what we detected" matching surfaced proactively on Home, which production
 * has no route or job that does; the real ADS-B search that exists
 * (NewFlightClient's "search" mode) is something the student opens
 * themselves on /flights/new, not something Home can honestly claim to have
 * already found. Two real states remain: a flight recorded but not yet
 * debriefed (JustFlew), and everything else (BetweenFlights).
 */
export default async function StudentHomePage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const solo = viewer.organization.kind === "individual";
  const studentId = viewer.user.id;

  const [flights, brief, radioPractice, milestones] = await Promise.all([
    repo.listFlights({ studentId }),
    computeNextLessonBrief(repo, studentId),
    repo.listRadioPracticeAssignments(studentId),
    repo.listMilestones(studentId),
  ]);
  const pendingRadioPractice = radioPractice.filter((a) => a.status === "assigned");
  const completedRadioPractice = radioPractice.filter((a) => a.status === "completed").slice(0, 5);
  const scenarioTitle = (scenarioId: string) =>
    RADIO_PRACTICE_SCENARIOS.find((s) => s.id === scenarioId)?.title ?? "Radio call";

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

  const pendingFlight = [...flights]
    .filter((f) => f.debriefStatus !== "complete")
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate))[0] ?? null;
  const pendingProgress = pendingFlight ? await computeDebriefProgress(repo, pendingFlight) : null;
  const cfi = resolveCfiFirstName(brief.lastInstructor);
  const debriefedCount = flights.filter((f) => f.debriefStatus === "complete").length;

  return (
    <Screen>
      <p className="text-[15px] text-foreground-faint">
        Welcome back, <span className="font-medium text-foreground">{viewer.user.name.split(" ")[0]}</span>
      </p>

      {pendingFlight && pendingProgress ? (
        <>
          {solo ? null : <AutoRefresh intervalMs={15000} />}
          <Panel>
            <PanelEyebrow icon={<Plane className="size-3.5" aria-hidden />}>Flight complete</PanelEyebrow>
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
            <div className="mt-5 flex flex-col gap-2.5">
              <PanelButton href={`/flights/${pendingFlight.id}/debrief`}>
                <Mic className="size-[18px]" aria-hidden />
                {solo ? "Start debrief" : pendingProgress.stage === "awaiting_student_assessment" ? "Do it now" : "Open"}
              </PanelButton>
              <SecondaryButton href={`/flights/${pendingFlight.id}`} onPanel>
                View flight
              </SecondaryButton>
            </div>
          </Panel>
        </>
      ) : brief.upcomingReservation ? (
        <Panel>
          <PanelEyebrow icon={<Plane className="size-3.5" aria-hidden />}>Next flight</PanelEyebrow>
          <PanelHeadline>
            <LocalDateTime
              iso={brief.upcomingReservation.scheduledStart}
              options={{ weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }}
            />
          </PanelHeadline>
          <PanelMeta>Instructor: {brief.upcomingReservationInstructor?.name ?? "TBD"}</PanelMeta>
          {brief.focusAreas.length > 0 ? (
            <div className="mt-6 border-t border-panel-hairline pt-5">
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-panel-foreground-soft">
                Focus on {brief.focusAreas.length === 1 ? "this" : `${brief.focusAreas.length} things`}
              </p>
              <ol className="mt-3 flex flex-col gap-3">
                {brief.focusAreas.map((f, i) => (
                  <li key={f} className="flex items-start gap-3.5">
                    <span className="mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full bg-panel-elevated text-[13px] font-semibold tabular-nums text-panel-foreground-soft">
                      {i + 1}
                    </span>
                    <span className="text-[17px] leading-snug">{f}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </Panel>
      ) : brief.lastFlight ? (
        <Panel>
          <PanelEyebrow icon={<Plane className="size-3.5" aria-hidden />}>Latest flight</PanelEyebrow>
          <PanelHeadline>
            {brief.lastFlight.departureAirport} → {brief.lastFlight.arrivalAirport}
          </PanelHeadline>
          <PanelMeta>
            {new Date(brief.lastFlight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {" · "}
            {brief.lastFlight.aircraft.tailNumber} · {formatDurationShort(brief.lastFlight.durationMinutes)}
          </PanelMeta>
        </Panel>
      ) : null}

      {/* The instructor's own words, real and verbatim -- lib/training-memory.ts
          never fabricates this field. Only shown outside the pending-debrief
          state, where the Panel's own content already carries the moment. */}
      {!pendingFlight && cfi && brief.lastInstructorNote ? (
        <Section title={`${cfi}'s key reminder`}>
          <Evidence label={cfi} tone="instructor" text={brief.lastInstructorNote.quote} />
        </Section>
      ) : null}

      {!pendingFlight && brief.lastFlight ? (
        <div className="flex flex-col gap-2.5">
          <PrimaryButton href="/train">
            Train with Vector
            <ArrowRight className="size-[18px]" aria-hidden />
          </PrimaryButton>
          {cfi ? (
            <p className="px-1 text-[13px] leading-relaxed text-foreground-faint">
              Vector is your AI flight trainer. It knows what {cfi} flagged and helps you prepare before your next
              flight.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col">
        {brief.lastFlight ? <QuietRow href="/next-lesson" label="Prepare for next flight" /> : null}
        <QuietRow href="/dashboard" label="My flights" meta={flights.length} />
        <QuietRow href="/debrief" label="Debriefs" meta={debriefedCount} />
        <QuietRow href="/progress" label="See progress" />
      </div>

      {rewardsStats ? (
        <Section title="At a glance">
          <div className="flex gap-6">
            {rewardsStats.map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-[22px] font-semibold tabular-nums text-foreground">{stat.value}</span>
                <span className="text-[13px] text-foreground-faint">{stat.label}</span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {pendingRadioPractice.length > 0 || completedRadioPractice.length > 0 ? (
        <RadioPracticeCard
          assigned={pendingRadioPractice.map((a) => ({ id: a.id, title: scenarioTitle(a.scenarioId) }))}
          practiced={completedRadioPractice.map((a) => ({
            id: a.id,
            title: scenarioTitle(a.scenarioId),
            correct: a.correct ?? false,
          }))}
        />
      ) : null}

      {!brief.lastFlight && !brief.upcomingReservation && !pendingFlight ? (
        <Panel>
          <PanelEyebrow>No flights yet</PanelEyebrow>
          <PanelHeadline>Add your first training flight</PanelHeadline>
          <div className="mt-5">
            <PanelButton href="/flights/new">Add a flight</PanelButton>
          </div>
        </Panel>
      ) : null}
    </Screen>
  );
}
