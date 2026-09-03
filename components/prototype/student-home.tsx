import type { ReactNode } from "react";
import { ArrowRight, Mic, Plane, PlaneLanding, PlaneTakeoff, Plus } from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import { Evidence, Panel, PanelButton, PanelEyebrow, PanelHeadline, PanelMeta, PageTitle, PrimaryButton, QuietRow, Screen, Section, SecondaryButton } from "@/components/prototype/ui";

/**
 * Home's real content, shared between app/prototype/vector/page.tsx (fixture
 * props) and app/(product)/home/page.tsx (database-derived props) -- the
 * same component renders for both, not two implementations kept in sync by
 * hand. Only the JustFlew and BetweenFlights states are here: JustLanded
 * has no production counterpart (it needs proactive ADS-B "did you fly
 * today" detection Home has no job to produce) and stays a prototype-only
 * function in that route file.
 */
export type StudentHomePanel =
  | {
      kind: "justFlew";
      flightContext: string;
      bodyText: string;
      primaryLabel: string;
      primaryHref: string;
      secondaryHref: string;
      showAutoRefresh: boolean;
    }
  | { kind: "nextFlight"; dateTimeLabel: ReactNode; instructorName: string; focusItems: string[] }
  | { kind: "lastFlight"; route: string; metaLabel: string }
  | { kind: "empty"; addFlightHref: string };

export interface StudentHomeProps {
  firstName: string;
  panel: StudentHomePanel;
  /** Only meaningful alongside a "justFlew" panel. */
  justFlewRows?: { myFlightsHref: string; myFlightsCount: number; pastDebriefsHref: string; pastDebriefsCount: number };
  /** Only meaningful alongside "nextFlight"/"lastFlight" -- absent for "empty". */
  keyReminder?: { instructorFirstName: string; quote: string } | null;
  trainCta?: { instructorFirstName: string | null; href: string } | null;
  /** Prototype-only capability -- production never supplies this (no save endpoint for a live-recorded session), so it never renders there. */
  startFlightHref?: string | null;
  addFlightHref?: string | null;
  bottomRows?: {
    myFlightsHref: string;
    myFlightsCount: number;
    lastDebrief: { href: string; dateLabel: string } | null;
    progressHref: string;
  };
}

export function StudentHome({ firstName, panel, justFlewRows, keyReminder, trainCta, startFlightHref, addFlightHref, bottomRows }: StudentHomeProps) {
  return (
    <Screen>
      <PageTitle kicker="Welcome back">{firstName}</PageTitle>

      {panel.kind === "justFlew" ? (
        <>
          {panel.showAutoRefresh ? <AutoRefresh intervalMs={15000} /> : null}
          <Panel>
            <PanelEyebrow icon={<PlaneLanding className="size-3.5" aria-hidden />}>Flight complete</PanelEyebrow>
            <PanelHeadline>{panel.flightContext}</PanelHeadline>
            <PanelMeta>{panel.bodyText}</PanelMeta>
            <div className="mt-4 flex flex-col gap-2.5">
              <PanelButton href={panel.primaryHref}>
                <Mic className="size-[18px]" aria-hidden />
                {panel.primaryLabel}
              </PanelButton>
              <SecondaryButton href={panel.secondaryHref} onPanel>
                View flight
              </SecondaryButton>
            </div>
          </Panel>

          {justFlewRows ? (
            <div className="flex flex-col">
              <QuietRow href={justFlewRows.myFlightsHref} label="My flights" meta={justFlewRows.myFlightsCount} />
              <QuietRow href={justFlewRows.pastDebriefsHref} label="Past debriefs" meta={justFlewRows.pastDebriefsCount} />
            </div>
          ) : null}

          <p className="text-[13px] leading-relaxed text-foreground-faint">
            Your audio is transcribed and then discarded. AfterFlight keeps the training record, not the recording.
          </p>
        </>
      ) : (
        <>
          {panel.kind === "nextFlight" ? (
            <Panel>
              <PanelEyebrow icon={<PlaneTakeoff className="size-3.5" aria-hidden />}>Next flight</PanelEyebrow>
              <PanelHeadline>{panel.dateTimeLabel}</PanelHeadline>
              <PanelMeta>{panel.instructorName}</PanelMeta>
              {panel.focusItems.length > 0 ? (
                <div className="mt-6 border-t border-panel-hairline pt-5">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-panel-foreground-soft">
                    Focus on {panel.focusItems.length === 1 ? "this" : `${panel.focusItems.length} things`}
                  </p>
                  <ol className="mt-3 flex flex-col gap-3">
                    {panel.focusItems.map((f, i) => (
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
          ) : panel.kind === "lastFlight" ? (
            <Panel>
              <PanelEyebrow icon={<Plane className="size-3.5" aria-hidden />}>Latest flight</PanelEyebrow>
              <PanelHeadline>{panel.route}</PanelHeadline>
              <PanelMeta>{panel.metaLabel}</PanelMeta>
            </Panel>
          ) : (
            <Panel>
              <PanelEyebrow>No flights yet</PanelEyebrow>
              <PanelHeadline>Add your first training flight</PanelHeadline>
              <div className="mt-5">
                <PanelButton href={panel.addFlightHref}>Add a flight</PanelButton>
              </div>
            </Panel>
          )}

          {panel.kind !== "empty" ? (
            <>
              {keyReminder ? (
                <Section title={`${keyReminder.instructorFirstName}'s key reminder`}>
                  <Evidence label={keyReminder.instructorFirstName} tone="instructor" text={keyReminder.quote} />
                </Section>
              ) : null}

              {trainCta ? (
                <div className="flex flex-col gap-2.5">
                  <PrimaryButton href={trainCta.href}>
                    Train with Vector
                    <ArrowRight className="size-[18px]" aria-hidden />
                  </PrimaryButton>
                  {trainCta.instructorFirstName ? (
                    <p className="px-1 text-[13px] leading-relaxed text-foreground-faint">
                      Vector is your AI flight trainer. It knows what {trainCta.instructorFirstName} flagged and helps
                      you prepare before your next flight.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {/* startFlightHref is prototype-only -- a live-recording
                  session with no save endpoint in production, so it's never
                  supplied there and this collapses to the single real
                  "Add a flight" button. */}
              {startFlightHref && addFlightHref ? (
                <div className="flex gap-2.5">
                  <SecondaryButton href={startFlightHref}>
                    <Plane className="size-[18px]" aria-hidden />
                    Start flight
                  </SecondaryButton>
                  <SecondaryButton href={addFlightHref}>
                    <Plus className="size-[18px]" aria-hidden />
                    Add a flight
                  </SecondaryButton>
                </div>
              ) : addFlightHref ? (
                <SecondaryButton href={addFlightHref}>
                  <Plus className="size-[18px]" aria-hidden />
                  Add a flight
                </SecondaryButton>
              ) : null}

              {bottomRows ? (
                <div className="flex flex-col">
                  <QuietRow href={bottomRows.myFlightsHref} label="My flights" meta={bottomRows.myFlightsCount} />
                  {bottomRows.lastDebrief ? (
                    <QuietRow href={bottomRows.lastDebrief.href} label="Review last debrief" meta={bottomRows.lastDebrief.dateLabel} />
                  ) : null}
                  <QuietRow href={bottomRows.progressHref} label="See progress" />
                </div>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}
