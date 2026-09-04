"use client";

import { useEffect, useState } from "react";
import { Check, Mic, Square } from "lucide-react";
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
  SecondaryButton,
} from "@/components/student/ui";
import { ObjectivesScreen } from "@/components/student/debrief/objectives-screen";
import { HandoffScreen } from "@/components/student/debrief/handoff-screen";
import { RevealScreen } from "@/components/student/debrief/reveal-screen";
import { PerformanceLevelPicker } from "@/components/student/debrief/performance-level-picker";
import { cn } from "@/lib/utils";
import type { PerformanceLevelCode } from "@/lib/performance-levels";
import type { Rater } from "@/lib/student/assessment";
import { ACS_AREAS, INSTRUCTOR, PENDING_FLIGHT, PERCEPTION_GAPS, STRUCTURED } from "@/lib/prototype-fixtures/vector-data";
import { flightById, formatHours } from "@/lib/prototype-fixtures/flights";

const FLIGHT = flightById("aug-29")!;

/** The lesson objectives are the unit of assessment, and both people rate this same list. */
const OBJECTIVES = PERCEPTION_GAPS.map((g) => g.task);

type Stage =
  | "objectives"
  | "student"
  | "handoff"
  | "instructor"
  | "reveal"
  | "ready"
  | "recording"
  | "processing"
  | "review";

type Ratings = Partial<Record<string, PerformanceLevelCode>>;

/**
 * The guided debrief.
 *
 * The old flow opened by asking who was giving feedback and then ran one of
 * two independent paths. That framing was the mistake: it treated the
 * student's view and the instructor's view as alternative content, so the
 * comparison between them -- the thing that actually teaches -- was optional
 * and usually skipped. The lesson objective is the unit of assessment, both
 * people rate the same list, and the flow does not branch.
 *
 * Order is load-bearing. The student rates first and their answers stay hidden
 * through the handoff, because an instructor who can see "Felt Solid" before
 * rating is no longer producing an independent judgment, and a comparison
 * between a judgment and an echo of it is worthless. Recording comes last,
 * once both sides can see where they differed, so the conversation has
 * something specific to be about.
 */
export default function NewDebriefPage() {
  const [stage, setStage] = useState<Stage>("objectives");
  const [studentRatings, setStudentRatings] = useState<Ratings>({});
  const [instructorRatings, setInstructorRatings] = useState<Ratings>({});

  return (
    <Screen>
      {stage === "recording" ? null : <BackLink href="/prototype/vector/debrief">Debriefs</BackLink>}

      {stage === "objectives" ? <Objectives onStart={() => setStage("student")} /> : null}
      {stage === "student" ? (
        <Assess
          rater="student"
          ratings={studentRatings}
          onRate={(task, level) => setStudentRatings((r) => ({ ...r, [task]: level }))}
          onDone={() => setStage("handoff")}
        />
      ) : null}
      {stage === "handoff" ? <Handoff onContinue={() => setStage("instructor")} /> : null}
      {stage === "instructor" ? (
        <Assess
          rater="instructor"
          ratings={instructorRatings}
          onRate={(task, level) => setInstructorRatings((r) => ({ ...r, [task]: level }))}
          onDone={() => setStage("reveal")}
        />
      ) : null}
      {stage === "reveal" ? (
        <Reveal student={studentRatings} instructor={instructorRatings} onNext={() => setStage("ready")} />
      ) : null}
      {stage === "ready" ? <Ready onStart={() => setStage("recording")} /> : null}
      {stage === "recording" ? <Recording onStop={() => setStage("processing")} /> : null}
      {stage === "processing" ? <Processing onDone={() => setStage("review")} /> : null}
      {stage === "review" ? <Review /> : null}
    </Screen>
  );
}

/* ------------------------------------------------------ 1. objectives */

function Objectives({ onStart }: { onStart: () => void }) {
  return (
    <ObjectivesScreen
      lessonTitle={PENDING_FLIGHT.lesson}
      route={`${FLIGHT.departureAirport} → ${FLIGHT.arrivalAirport}`}
      durationLabel={`${formatHours(FLIGHT.durationMinutes)} hr`}
      dateLabel={PENDING_FLIGHT.date}
      aircraftType={FLIGHT.aircraftType}
      tailNumber={FLIGHT.tailNumber}
      objectives={OBJECTIVES}
      instructorFirstName={INSTRUCTOR.firstName}
      changeHref="/prototype/vector/flights/new"
      onStart={onStart}
    />
  );
}

/* -------------------------------------------------- 2 + 4. assessment */

function Assess({
  rater,
  ratings,
  onRate,
  onDone,
}: {
  rater: Rater;
  ratings: Ratings;
  onRate: (task: string, level: PerformanceLevelCode) => void;
  onDone: () => void;
}) {
  const student = rater === "student";
  const done = OBJECTIVES.every((o) => ratings[o]);
  const count = OBJECTIVES.filter((o) => ratings[o]).length;

  return (
    <>
      <PageTitle kicker={student ? "Your assessment" : `${INSTRUCTOR.firstName}'s assessment`}>
        {student ? "How did this feel to you?" : "How did the student perform?"}
      </PageTitle>

      <p className="-mt-4 text-[17px] leading-relaxed text-foreground-soft">
        {student
          ? "Your own read of the flight, before you see anything else. There is no wrong answer here — it is what you thought."
          : `Rate the same objectives ${student ? "" : "independently"}. You will both see the comparison next.`}
      </p>

      <div className="flex flex-col gap-3">
        {OBJECTIVES.map((task) => (
          <Card key={task} className="flex flex-col gap-4">
            <p className="text-[17px] font-medium leading-snug text-foreground">{task}</p>
            <PerformanceLevelPicker rater={rater} value={ratings[task] ?? null} onChange={(level) => onRate(task, level)} />
          </Card>
        ))}
      </div>

      <PrimaryButton onClick={done ? onDone : undefined}>
        {done ? (student ? "Hand over to " + INSTRUCTOR.firstName : "See the comparison") : `${count} of ${OBJECTIVES.length} rated`}
      </PrimaryButton>
    </>
  );
}

/* --------------------------------------------------------- 3. handoff */

function Handoff({ onContinue }: { onContinue: () => void }) {
  return (
    <HandoffScreen
      headline={`Hand the device to ${INSTRUCTOR.firstName}`}
      body={`${INSTRUCTOR.firstName} will rate the same objectives. Your answers stay hidden until they finish, so their read of the flight stays their own.`}
      actionLabel={`I'm ${INSTRUCTOR.firstName} — continue`}
      onAction={onContinue}
    />
  );
}

/* ---------------------------------------------------------- 5. reveal */

function Reveal({
  student,
  instructor,
  onNext,
}: {
  student: Ratings;
  instructor: Ratings;
  onNext: () => void;
}) {
  const rows = OBJECTIVES.map((task) => ({
    task,
    student: student[task]!,
    instructor: instructor[task]!,
  })).filter((r) => r.student && r.instructor);

  return (
    <RevealScreen
      kicker={`${PENDING_FLIGHT.lesson} · ${PENDING_FLIGHT.date}`}
      rows={rows}
      instructorFirstName={INSTRUCTOR.firstName}
      onAction={onNext}
    />
  );
}

/* ----------------------------------------------------------- 6. ready */

function Ready({ onStart }: { onStart: () => void }) {
  return (
    <>
      <PageTitle kicker={`${PENDING_FLIGHT.lesson} · ${PENDING_FLIGHT.date}`}>Talk it through</PageTitle>
      <p className="-mt-4 text-[17px] leading-relaxed text-foreground-soft">
        Review where you agreed, where you saw the flight differently, and what should carry into the next lesson.
        There&rsquo;s nothing to fill in &mdash; just talk.
      </p>

      <div className="flex flex-col items-center gap-6 py-6">
        <button
          onClick={onStart}
          aria-label="Start debrief recording"
          className="flex size-[132px] cursor-pointer items-center justify-center rounded-full bg-brand text-on-brand transition-transform duration-200 active:scale-[0.97]"
        >
          <Mic className="size-11" strokeWidth={1.8} aria-hidden />
        </button>
        <p className="text-[15px] text-foreground-faint">About 90 seconds is plenty</p>
      </div>

      <PrimaryButton onClick={onStart}>Start debrief recording</PrimaryButton>
      <p className="-mt-4 text-center text-[13px] leading-relaxed text-foreground-faint">
        Your audio is transcribed and then discarded. AfterFlight keeps the training record, not the recording.
      </p>
    </>
  );
}

/* ------------------------------------------------------- 7. recording */

function Recording({ onStop }: { onStop: () => void }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <Panel className="flex flex-col items-center gap-7 py-10">
      <div className="flex items-center gap-2">
        <span className="size-2 animate-pulse rounded-full bg-brand" aria-hidden />
        <span className="text-[13px] font-semibold uppercase tracking-[0.1em] text-panel-foreground-soft">
          Recording the debrief
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
  );
}

const WAVEFORM_BARS = Array.from({ length: 34 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7)) * 0.75);

function Waveform() {
  return (
    <div className="flex h-14 w-full items-center justify-center gap-[3px]" aria-hidden>
      {WAVEFORM_BARS.map((h, i) => (
        <span
          key={i}
          className="w-[3px] animate-pulse rounded-full bg-brand/70"
          style={{ height: `${h * 100}%`, animationDelay: `${(i % 7) * 90}ms`, animationDuration: "1.1s" }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------ 8. processing */

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

/* ---------------------------------------------------------- 9. review */

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

      <Section title={<>Went well</>}>
        <ul className="flex flex-col gap-3">
          {STRUCTURED.wentWell.map((w) => (
            <li key={w} className="flex items-start gap-3 text-[17px] leading-snug text-foreground">
              <Check className="mt-1 size-4 shrink-0 text-state-good" aria-hidden />
              {w}
            </li>
          ))}
        </ul>
      </Section>

      <Section title={<>Work on</>}>
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

      <Section title={<>{INSTRUCTOR.firstName} wants next</>}>
        <div className="flex flex-col gap-5">
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
