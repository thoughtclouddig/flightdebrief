import type { Metadata } from "next";
import { ArrowRight, Mic, PlaneLanding, PlaneTakeoff } from "lucide-react";
import {
  Evidence,
  PageTitle,
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
import { INSTRUCTOR, NEXT_LESSON, PENDING_FLIGHT, STRUCTURED, STUDENT } from "@/lib/prototype/vector-data";

export const metadata: Metadata = { title: "Home — AfterFlight", robots: { index: false, follow: false } };

/**
 * Home is state-aware, and that is the point of this screen.
 *
 * The previous version assumed a debrief had already happened, which meant it
 * had nothing to say in the twenty minutes that matter most -- the ones right
 * after shutdown, when the details are still in the student's head and the
 * debrief is the only thing worth doing. Two states:
 *
 *   A. flown, not debriefed  -> START DEBRIEF is the single obvious action
 *   B. between flights       -> TRAIN WITH VECTOR against Thursday's focus
 *
 * Both answer the same question: what should I do now?
 */
export default async function PrototypeHome({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state } = await searchParams;
  return state === "flown" ? <JustFlew /> : <BetweenFlights />;
}

/* -------------------------------------------------- STATE A: needs debrief */

function JustFlew() {
  return (
    <Screen>
      <PageTitle kicker="Good afternoon">{STUDENT.firstName}</PageTitle>

      <Panel>
        <PanelEyebrow icon={<PlaneLanding className="size-3.5" aria-hidden />}>Flight complete</PanelEyebrow>
        <PanelHeadline>{PENDING_FLIGHT.lesson}</PanelHeadline>
        <PanelMeta>
          {PENDING_FLIGHT.instructor} · {PENDING_FLIGHT.date} · {PENDING_FLIGHT.duration} hrs
        </PanelMeta>
        {/* The reason to act now, not a feature description. */}
        <p className="mt-5 text-[15px] leading-relaxed text-panel-foreground-soft">
          Capture what mattered while it&rsquo;s fresh.
        </p>
        <div className="mt-4 flex flex-col gap-2.5">
          <PanelButton href="/prototype/vector/debrief/new">
            <Mic className="size-[18px]" aria-hidden />
            Start debrief
          </PanelButton>
          <SecondaryButton href="/prototype/vector/debrief/new?mode=reflection" onPanel>
            Add my reflection
          </SecondaryButton>
        </div>
      </Panel>

      {/* Nothing else competes. Everything below is navigation, not action. */}
      <div className="flex flex-col">
        <QuietRow href="/prototype/vector/debrief" label="Past debriefs" meta="3" />
        <QuietRow href="/prototype/vector/progress" label="See progress" meta="4 skills" />
      </div>

      <p className="text-[13px] leading-relaxed text-foreground-faint">
        Your audio is transcribed and then discarded. AfterFlight keeps the training record, not the recording.
      </p>
    </Screen>
  );
}

/* ----------------------------------------------- STATE B: between flights */

function BetweenFlights() {
  return (
    <Screen>
      <PageTitle kicker="Good afternoon">{STUDENT.firstName}</PageTitle>

      <Panel>
        <PanelEyebrow icon={<PlaneTakeoff className="size-3.5" aria-hidden />}>Next flight</PanelEyebrow>
        <PanelHeadline>
          {NEXT_LESSON.date} · {NEXT_LESSON.time}
        </PanelHeadline>
        <PanelMeta>
          {INSTRUCTOR.firstName} · Crosswind + Short Field
        </PanelMeta>

        <div className="mt-6 border-t border-panel-hairline pt-5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-panel-foreground-soft">
            Focus on 2 things
          </p>
          <ol className="mt-3 flex flex-col gap-3">
            {STRUCTURED.nextFlightFocus.map((f, i) => (
              <li key={f} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full bg-panel-elevated text-[13px] font-semibold tabular-nums text-panel-foreground-soft">
                  {i + 1}
                </span>
                <span className="text-[17px] leading-snug">{f}</span>
              </li>
            ))}
          </ol>
        </div>
      </Panel>

      <Section title={<>{INSTRUCTOR.firstName}&rsquo;s key reminder</>}>
        <Evidence label={INSTRUCTOR.firstName} tone="instructor" text={STRUCTURED.instructorEmphasis[0]!.quote} />
      </Section>

      <div className="flex flex-col gap-2.5">
        <PrimaryButton href="/prototype/vector/train">
          Train with Vector
          <ArrowRight className="size-[18px]" aria-hidden />
        </PrimaryButton>
        {/* Vector is a brand name a first-time student cannot define. Say what
            it is at the point they are asked to tap it. */}
        <p className="px-1 text-[13px] leading-relaxed text-foreground-faint">
          Vector is your AI flight trainer. It knows what {INSTRUCTOR.firstName} flagged and helps you prepare before{" "}
          {NEXT_LESSON.date}.
        </p>
      </div>

      <div className="flex flex-col">
        <QuietRow href="/prototype/vector/debrief/latest" label="Review last debrief" meta="Aug 29" />
        <QuietRow href="/prototype/vector/progress" label="See progress" meta="4 skills" />
      </div>
    </Screen>
  );
}
