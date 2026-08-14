import type { ReactNode } from "react";
import { FlightCard } from "@/components/flight-card";
import { FlightMap } from "@/components/flight-map";
import { NextLessonFocusCard } from "@/components/next-lesson-focus-card";
import { DemoWaveform } from "@/components/marketing/demo-waveform";
import { Reveal } from "@/components/marketing/reveal";
import { DEMO_FLIGHT, DEMO_NEXT_LESSON_FOCUS, DEMO_STRUCTURED_DEBRIEF } from "@/lib/marketing/demo-data";

function Step({
  title,
  body,
  visual,
}: {
  title: string;
  body: string;
  visual: ReactNode;
}) {
  return (
    <Reveal className="grid grid-cols-1 gap-8 border-t border-hairline py-16 md:grid-cols-2 md:gap-14 md:py-20">
      <div>
        <h3 className="font-display text-balance text-3xl font-extrabold uppercase leading-[1.02] text-foreground sm:text-4xl">
          {title}
        </h3>
        <p className="mt-4 max-w-md text-pretty text-[16px] leading-relaxed text-foreground-soft">{body}</p>
      </div>
      <div className="flex items-center">{visual}</div>
    </Reveal>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-8 sm:py-12">
      <Reveal>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">How it works</p>
        <h2 className="font-display mt-3 max-w-2xl text-balance text-4xl font-extrabold uppercase leading-[1.02] text-foreground sm:text-5xl">
          Just have the debrief you already have.
        </h2>
      </Reveal>

      <Step
        title="Fly"
        body="Fly the lesson like you always do. AfterFlight already knows the student, instructor, aircraft, and route."
        visual={
          <div className="flex w-full flex-col gap-3">
            <FlightMap track={DEMO_FLIGHT.track} />
            <FlightCard flight={DEMO_FLIGHT} href="/app" />
          </div>
        }
      />

      <Step
        title="Talk"
        body="Have your normal post-flight conversation. No questionnaire — the student and CFI just talk."
        visual={
          <div className="w-full rounded-lg border border-hairline bg-surface p-6">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
                </span>
                Recording Debrief
              </span>
              <span className="tabular-nums text-sm text-foreground-faint">06:42</span>
            </div>
            <div className="mt-5">
              <DemoWaveform />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground-soft">
              &ldquo;…first two approaches were a little fast, but the last three were much better. Danny wants me
              configured earlier next time…&rdquo;
            </p>
          </div>
        }
      />

      <Step
        title="Remember"
        body="AfterFlight organizes what matters, including anything actually said by the instructor — never invented."
        visual={
          <div className="w-full rounded-lg border border-hairline bg-surface p-5">
            <dl className="flex flex-col gap-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">What We Did</dt>
                <dd className="mt-1 text-foreground-soft">{DEMO_STRUCTURED_DEBRIEF.whatWeDid.join(", ")}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">Went Well</dt>
                <dd className="mt-1 text-foreground-soft">{DEMO_STRUCTURED_DEBRIEF.wentWell.join(", ")}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">Needs Work</dt>
                <dd className="mt-1 text-foreground-soft">{DEMO_STRUCTURED_DEBRIEF.needsWork.join(", ")}</dd>
              </div>
              <div className="rounded-md bg-brand/5 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand">CFI Guidance</dt>
                <dd className="mt-1 text-foreground">{DEMO_STRUCTURED_DEBRIEF.cfiGuidance}</dd>
              </div>
            </dl>
          </div>
        }
      />

      <Step
        title="Come back ready"
        body="Today's debrief becomes tomorrow's AfterFlight brief — the plan is already there before you get to the airport."
        visual={<NextLessonFocusCard title="Next Flight Brief" items={DEMO_NEXT_LESSON_FOCUS} className="w-full" />}
      />
    </section>
  );
}
