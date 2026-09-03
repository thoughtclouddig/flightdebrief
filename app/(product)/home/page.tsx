import { ArrowRight, Mic, Plane, PlaneLanding, PlaneTakeoff, Plus } from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import { LocalDateTime } from "@/components/local-date-time";
import {
  Evidence,
  Panel,
  PanelButton,
  PanelEyebrow,
  PanelHeadline,
  PanelMeta,
  PageTitle,
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
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatDurationShort, formatFlightContext } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Home -- Phase 6 exact reproduction of app/prototype/vector/page.tsx's
 * structure (JustLanded/JustFlew/BetweenFlights), not an interpretation of
 * it. "Good afternoon" became "Welcome back" -- the only copy change on the
 * greeting -- because this is server-rendered with no real knowledge of the
 * visitor's local time; claiming a time of day would be a guess dressed as
 * a fact. Everything else below matches the prototype's section order,
 * labels and QuietRow meta pattern; only fixture values became real ones.
 *
 * Two things the prototype's Home has that this deliberately drops, per
 * the "don't add cards the prototype doesn't have" instruction now in
 * force: the rewards-stat row (Captured/Streak/Badges) and
 * RadioPracticeCard. Neither has a slot in any /prototype/vector screen.
 * Flagged for a product decision, not placed here by guess.
 *
 * JustLanded is still not ported -- unchanged reasoning from Phase 4: it
 * depends on proactive ADS-B "did you fly today" detection Home has no
 * route or job to produce.
 */
export default async function StudentHomePage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const solo = viewer.organization.kind === "individual";
  const studentId = viewer.user.id;

  const [flights, brief] = await Promise.all([
    repo.listFlights({ studentId }),
    computeNextLessonBrief(repo, studentId),
  ]);

  const pendingFlight = [...flights]
    .filter((f) => f.debriefStatus !== "complete")
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate))[0] ?? null;
  const pendingProgress = pendingFlight ? await computeDebriefProgress(repo, pendingFlight) : null;
  const cfi = resolveCfiFirstName(brief.lastInstructor);
  const debriefedCount = flights.filter((f) => f.debriefStatus === "complete").length;

  return (
    <Screen>
      <PageTitle kicker="Welcome back">{viewer.user.name.split(" ")[0]}</PageTitle>

      {pendingFlight && pendingProgress ? (
        <>
          {solo ? null : <AutoRefresh intervalMs={15000} />}
          <Panel>
            <PanelEyebrow icon={<PlaneLanding className="size-3.5" aria-hidden />}>Flight complete</PanelEyebrow>
            <PanelHeadline>{formatFlightContext(pendingFlight)}</PanelHeadline>
            <PanelMeta>
              {solo
                ? "Capture what mattered while it's fresh."
                : pendingProgress.stage === "awaiting_tasks" || pendingProgress.stage === "awaiting_instructor_assessment"
                  ? "Waiting on your instructor."
                  : pendingProgress.stage === "awaiting_student_assessment"
                    ? "Your instructor submitted their assessment -- your turn."
                    : pendingProgress.stage === "awaiting_finish"
                      ? "Recorded -- your instructor still needs to finish reviewing it with you."
                      : "Both assessments are in -- your instructor is starting the debrief."}
            </PanelMeta>
            <div className="mt-4 flex flex-col gap-2.5">
              <PanelButton href={`/flights/${pendingFlight.id}/debrief`}>
                <Mic className="size-[18px]" aria-hidden />
                {solo ? "Start debrief" : pendingProgress.stage === "awaiting_student_assessment" ? "Do it now" : "Open"}
              </PanelButton>
              <SecondaryButton href={`/flights/${pendingFlight.id}`} onPanel>
                View flight
              </SecondaryButton>
            </div>
          </Panel>

          <div className="flex flex-col">
            <QuietRow href="/dashboard" label="My flights" meta={flights.length} />
            <QuietRow href="/debrief" label="Past debriefs" meta={debriefedCount} />
          </div>

          <p className="text-[13px] leading-relaxed text-foreground-faint">
            Your audio is transcribed and then discarded. AfterFlight keeps the training record, not the recording.
          </p>
        </>
      ) : (
        <>
          {brief.upcomingReservation ? (
            <Panel>
              <PanelEyebrow icon={<PlaneTakeoff className="size-3.5" aria-hidden />}>Next flight</PanelEyebrow>
              <PanelHeadline>
                <LocalDateTime
                  iso={brief.upcomingReservation.scheduledStart}
                  options={{ weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }}
                />
              </PanelHeadline>
              <PanelMeta>{brief.upcomingReservationInstructor?.name ?? "TBD"}</PanelMeta>
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
          ) : (
            <Panel>
              <PanelEyebrow>No flights yet</PanelEyebrow>
              <PanelHeadline>Add your first training flight</PanelHeadline>
              <div className="mt-5">
                <PanelButton href="/flights/new">Add a flight</PanelButton>
              </div>
            </Panel>
          )}

          {brief.lastFlight ? (
            <>
              {cfi && brief.lastInstructorNote ? (
                <Section title={`${cfi}'s key reminder`}>
                  <Evidence label={cfi} tone="instructor" text={brief.lastInstructorNote.quote} />
                </Section>
              ) : null}

              <div className="flex flex-col gap-2.5">
                <PrimaryButton href="/train">
                  Train with Vector
                  <ArrowRight className="size-[18px]" aria-hidden />
                </PrimaryButton>
                {cfi ? (
                  <p className="px-1 text-[13px] leading-relaxed text-foreground-faint">
                    Vector is your AI flight trainer. It knows what {cfi} flagged and helps you prepare before your
                    next flight.
                  </p>
                ) : null}
              </div>

              {/* Prototype pairs this with a "Start flight" button (a live-
                  recording session, lib/flight-recording/session.ts) -- not
                  wired anywhere in production yet (no endpoint saves a
                  completed session), so only the real path is offered here. */}
              <SecondaryButton href="/flights/new">
                <Plus className="size-[18px]" aria-hidden />
                Add a flight
              </SecondaryButton>

              <div className="flex flex-col">
                <QuietRow href="/dashboard" label="My flights" meta={flights.length} />
                <QuietRow
                  href={`/flights/${brief.lastFlight.id}/debrief/results`}
                  label="Review last debrief"
                  meta={new Date(brief.lastFlight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                />
                <QuietRow href="/progress" label="See progress" />
              </div>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}
