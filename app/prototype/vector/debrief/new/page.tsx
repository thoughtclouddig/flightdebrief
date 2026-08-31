"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Mic, PenLine, Square, UserRound } from "lucide-react";
import {
  AcsBadge,
  BackLink,
  Card,
  Evidence,
  PageTitle,
  Panel,
  PanelEyebrow,
  PanelHeadline,
  PrimaryButton,
  Screen,
  Section,
  SectionLabel,
  SecondaryButton,
} from "@/components/prototype/ui";
import { cn } from "@/lib/utils";
import { ACS_AREAS, INSTRUCTOR, PENDING_FLIGHT, STRUCTURED } from "@/lib/prototype/vector-data";

type Stage = "who" | "ready" | "recording" | "processing" | "review" | "reflection" | "done";
type Voice = "instructor" | "student";

/**
 * Debrief capture.
 *
 * Target interaction is four beats: tap -> talk -> stop -> done. Everything
 * else on this flow is in service of not interrupting those four. In
 * particular the instructor never fills in a form -- they talk, exactly as
 * they already do, and the structure is derived afterwards for the student to
 * confirm.
 *
 * The student reflection is collected as its own step and, when both are being
 * captured, BEFORE the full instructor interpretation is shown. The
 * perception-gap feature is only meaningful if the two inputs are independent;
 * showing Jake's read first would just be asking Mia to agree with it.
 */
export default function NewDebriefPage() {
  return (
    <Suspense fallback={null}>
      <NewDebrief />
    </Suspense>
  );
}

function NewDebrief() {
  const params = useSearchParams();
  const reflectionOnly = params.get("mode") === "reflection";
  const [stage, setStage] = useState<Stage>(reflectionOnly ? "reflection" : "who");
  const [voice, setVoice] = useState<Voice>("instructor");

  return (
    <Screen>
      {stage === "recording" ? null : <BackLink href="/prototype/vector/debrief">Debriefs</BackLink>}

      {stage === "who" ? <Who onPick={(v) => { setVoice(v); setStage("ready"); }} /> : null}
      {stage === "ready" ? <Ready voice={voice} onStart={() => setStage("recording")} /> : null}
      {stage === "recording" ? <Recording voice={voice} onStop={() => setStage("processing")} /> : null}
      {stage === "processing" ? <Processing onDone={() => setStage(voice === "instructor" ? "reflection" : "review")} /> : null}
      {stage === "reflection" ? <Reflection onNext={() => setStage("review")} /> : null}
      {stage === "review" ? <Review /> : null}
    </Screen>
  );
}

/* ------------------------------------------------------------- 1. who */

function Who({ onPick }: { onPick: (v: Voice) => void }) {
  return (
    <>
      <PageTitle kicker={`${PENDING_FLIGHT.lesson} · ${PENDING_FLIGHT.date}`}>Start debrief</PageTitle>
      <Section>
        <SectionLabel>Who is giving feedback?</SectionLabel>
        <div className="flex flex-col gap-3">
          <Choice
            icon={<UserRound className="size-5" aria-hidden />}
            title={`${INSTRUCTOR.firstName}'s debrief`}
            body="Record what your instructor says about the flight."
            onClick={() => onPick("instructor")}
          />
          <Choice
            icon={<PenLine className="size-5" aria-hidden />}
            title="My reflection"
            body="How the flight felt to you, in your own words."
            onClick={() => onPick("student")}
          />
        </div>
      </Section>
    </>
  );
}

function Choice({ icon, title, body, onClick }: { icon: React.ReactNode; title: string; body: string; onClick: () => void }) {
  return (
    <Card onClick={onClick} className="flex items-start gap-4">
      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-foreground-soft">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-[15px] leading-relaxed text-foreground-soft">{body}</span>
      </span>
    </Card>
  );
}

/* ------------------------------------------------------------ 2. ready */

function Ready({ voice, onStart }: { voice: Voice; onStart: () => void }) {
  const instructor = voice === "instructor";
  return (
    <>
      <PageTitle kicker={`${PENDING_FLIGHT.lesson} · ${PENDING_FLIGHT.date}`}>
        {instructor ? `Record ${INSTRUCTOR.firstName}'s debrief` : "Record your reflection"}
      </PageTitle>
      <p className="-mt-4 text-[17px] leading-relaxed text-foreground-soft">
        {instructor
          ? "Hand them your phone, or record the conversation together. There's nothing to fill in — just talk through the flight the way you normally would."
          : "How did the flight feel to you? Say it before you read what your instructor said, so both views stay your own."}
      </p>

      <div className="flex flex-col items-center gap-6 py-6">
        <button
          onClick={onStart}
          aria-label="Start recording"
          className="flex size-[132px] cursor-pointer items-center justify-center rounded-full bg-brand text-on-brand transition-transform duration-200 active:scale-[0.97]"
        >
          <Mic className="size-11" strokeWidth={1.8} aria-hidden />
        </button>
        <p className="text-[15px] text-foreground-faint">About 90 seconds is plenty</p>
      </div>

      <PrimaryButton onClick={onStart}>Start recording</PrimaryButton>
      <p className="-mt-4 text-center text-[13px] leading-relaxed text-foreground-faint">
        Your audio is transcribed and then discarded. AfterFlight keeps the training record, not the recording.
      </p>
    </>
  );
}

/* -------------------------------------------------------- 3. recording */

/**
 * Minimal chrome on purpose: what's being captured, a live timer, a waveform
 * that proves the microphone is alive, and one unmistakable stop. No settings,
 * no navigation, no confirmation mid-recording.
 */
function Recording({ voice, onStop }: { voice: Voice; onStop: () => void }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <>
      <Panel className="flex flex-col items-center gap-7 py-10">
        <div className="flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-brand" aria-hidden />
          <span className="text-[13px] font-semibold uppercase tracking-[0.1em] text-panel-foreground-soft">
            Recording {voice === "instructor" ? INSTRUCTOR.firstName : "you"}
          </span>
        </div>

        <p className="text-[52px] font-semibold leading-none tabular-nums tracking-tight" aria-live="off">
          {mm}:{ss}
        </p>

        <Waveform />

        <button
          onClick={onStop}
          aria-label="Stop recording"
          className="flex size-20 cursor-pointer items-center justify-center rounded-full bg-panel-foreground text-panel transition-transform duration-200 active:scale-[0.97]"
        >
          <Square className="size-7 fill-current" aria-hidden />
        </button>
        <p className="text-[15px] text-panel-foreground-soft">Tap to stop when you&rsquo;re done</p>
      </Panel>
    </>
  );
}

/** Presentational only in the prototype; the shipped recorder drives this from live input levels. */
const WAVEFORM_BARS = Array.from({ length: 34 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7)) * 0.75);

function Waveform() {
  const bars = WAVEFORM_BARS;
  return (
    <div className="flex h-14 w-full items-center justify-center gap-[3px]" aria-hidden>
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[3px] animate-pulse rounded-full bg-brand/70"
          style={{ height: `${h * 100}%`, animationDelay: `${(i % 7) * 90}ms`, animationDuration: "1.1s" }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------- 4. processing */

/**
 * Named steps rather than a bar that lies. The student should be able to tell
 * it is working on THEIR flight, not spinning.
 */
const STEPS = ["Transcribing the debrief", "Finding what mattered", "Matching to ACS areas", "Building your next flight"];

function Processing({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= STEPS.length) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 900);
    return () => clearTimeout(t);
  }, [step, onDone]);

  return (
    <>
      <PageTitle kicker={`${PENDING_FLIGHT.lesson} · ${PENDING_FLIGHT.date}`}>Working on it</PageTitle>
      <ol className="flex flex-col gap-4" aria-live="polite">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-3.5">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                i < step ? "bg-state-good text-white" : "border border-hairline",
              )}
            >
              {i < step ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : null}
            </span>
            <span className={cn("text-[17px]", i < step ? "text-foreground" : "text-foreground-faint")}>{s}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

/* -------------------------------------------------------- 5. reflection */

function Reflection({ onNext }: { onNext: () => void }) {
  return (
    <>
      <PageTitle kicker="Before you read the debrief">Your turn</PageTitle>
      <p className="-mt-4 text-[17px] leading-relaxed text-foreground-soft">
        How did the flight feel to you? Answering first is what makes the comparison worth reading &mdash; if you see{" "}
        {INSTRUCTOR.firstName}&rsquo;s view first, you&rsquo;ll just agree with it.
      </p>
      <div className="flex flex-col gap-2.5">
        <PrimaryButton onClick={onNext}>
          <Mic className="size-[18px]" aria-hidden />
          Speak reflection
        </PrimaryButton>
        <div className="flex gap-2.5">
          <SecondaryButton onClick={onNext}>Type instead</SecondaryButton>
          <SecondaryButton onClick={onNext}>Skip for now</SecondaryButton>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------ 6. review */

function Review() {
  return (
    <>
      <Panel>
        <PanelEyebrow icon={<Check className="size-3.5" aria-hidden />}>Debrief captured</PanelEyebrow>
        <PanelHeadline>{PENDING_FLIGHT.lesson}</PanelHeadline>
        <p className="mt-3 text-[15px] leading-relaxed text-panel-foreground-soft">
          Here&rsquo;s what AfterFlight heard. Change anything that isn&rsquo;t right.
        </p>
      </Panel>

      <Section>
        <SectionLabel>Went well</SectionLabel>
        <ul className="flex flex-col gap-3">
          {STRUCTURED.wentWell.map((w) => (
            <li key={w} className="flex items-start gap-3 text-[17px] leading-snug text-foreground">
              <Check className="mt-1 size-4 shrink-0 text-state-good" aria-hidden />
              {w}
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionLabel>Work on</SectionLabel>
        <ul className="flex flex-col gap-3">
          {STRUCTURED.needsWork.map((w) => (
            <li key={w} className="flex items-start gap-3 text-[17px] leading-snug text-foreground">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-state-attention" aria-hidden />
              {w}
            </li>
          ))}
        </ul>
        <AcsBadge area={ACS_AREAS.landings} />
      </Section>

      <Section>
        <SectionLabel>{INSTRUCTOR.firstName} wants next</SectionLabel>
        <div className="flex flex-col gap-3">
          {STRUCTURED.instructorEmphasis.map((e) => (
            <Evidence key={e.quote} label={INSTRUCTOR.firstName} tone="instructor" text={e.quote} />
          ))}
        </div>
      </Section>

      <div className="flex flex-col gap-2.5">
        <PrimaryButton href="/prototype/vector/debrief/latest">Looks right</PrimaryButton>
        <SecondaryButton href="/prototype/vector/debrief/latest">Edit something</SecondaryButton>
      </div>
    </>
  );
}
