"use client";

import { useState } from "react";
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  Loader2,
  MessageCircleQuestion,
  PlaneTakeoff,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DesignInstructorEvidence } from "@/components/design/design-training-unit-card";
import { AileronEffectivenessDiagram, AudioCue, CrosswindProfileDiagram } from "@/components/design/design-vector-diagrams";
import {
  CHECK_QUESTION,
  CHECK_RESULT,
  COACH_MESSAGE,
  RADIO_MISSED_ELEMENT,
  SESSION_EVIDENCE,
  SESSION_SKILL_LABEL,
  TRANSFER_OBJECTIVE,
  type DesignVectorState,
} from "@/lib/design/vector-session-fixtures";

function SessionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-[var(--dm-border)] bg-[var(--dm-surface-elevated)] p-6 shadow-[var(--dm-shadow)] md:p-8 xl:p-10">
      {children}
    </div>
  );
}

function CardEyebrow({ icon: Icon, children }: { icon: typeof Brain; children: string }) {
  return (
    <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--dm-accent)]">
      <Icon className="size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

function CardHeadline({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-1.5 text-[26px] font-semibold leading-[1.1] tracking-[-0.01em] text-[var(--dm-text)] xl:text-[30px]">{children}</h2>;
}

function CardBody({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 max-w-[56ch] text-pretty text-[16px] leading-relaxed text-[var(--dm-text-soft)]">{children}</p>;
}

function PrimaryCta({ children, loading = false }: { children: React.ReactNode; loading?: boolean }) {
  return (
    <button
      type="button"
      className="mt-6 flex min-h-[52px] w-full max-w-[360px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[var(--dm-accent)] px-5 text-[17px] font-semibold text-[var(--dm-on-accent)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={loading}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

function QuietCta({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="mt-6 flex min-h-[44px] w-full max-w-[200px] cursor-pointer items-center justify-center rounded-xl border border-[var(--dm-border)] px-4 text-[15px] font-medium text-[var(--dm-text)] transition-colors hover:bg-[var(--dm-surface-muted)]"
    >
      {children}
    </button>
  );
}

/**
 * "Take this into your next flight," reused identically wherever a session
 * ends with an objective (transfer, and the knowledge check's own result)
 * instead of two different treatments for the same closing idea.
 */
function NextFlightObjective({ objective }: { objective: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-[var(--dm-border)] bg-[var(--dm-surface-muted)] p-5">
      <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--dm-text-soft)]">
        <PlaneTakeoff className="size-3.5 text-[var(--dm-accent)]" aria-hidden />
        Take this into your next flight
      </p>
      <p className="mt-1.5 text-pretty text-[15px] leading-relaxed text-[var(--dm-text)]">{objective}</p>
    </div>
  );
}

export function DesignVectorSession({ state }: { state: DesignVectorState }) {
  const [answer, setAnswer] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--dm-text-faint)]">Vector</p>
        {/* role="heading" + aria-level, not a real <h1> -- the real app's
            globals.css forces every <h1> to uppercase (a fine treatment for
            a short page title like "Train," unreadable for a full sentence
            like this one). Same semantic level for assistive tech, without
            triggering that unlayered, unscopeable global rule. */}
        <p role="heading" aria-level={1} className="text-[28px] font-semibold leading-[1.1] tracking-[-0.01em] text-[var(--dm-text)] xl:text-[32px]">
          Let&rsquo;s work on your {SESSION_SKILL_LABEL.toLowerCase()}.
        </p>
        <DesignInstructorEvidence quote={SESSION_EVIDENCE.quote} instructorName="Jake" flightDate="Sep 10" />
      </div>

      {state === "chair-fly" ? (
        <SessionCard>
          <CardEyebrow icon={Brain}>Let&rsquo;s rehearse this</CardEyebrow>
          <CardHeadline>Fly it in your head first</CardHeadline>
          <div className="mt-4 max-w-[420px] rounded-2xl bg-[var(--dm-surface-muted)] p-4">
            <CrosswindProfileDiagram />
          </div>
          <CardBody>
            I&rsquo;ll set the scene and stop at each decision point — you fly it in your head before you fly it for real.
          </CardBody>
          <PrimaryCta>Rehearse with Vector</PrimaryCta>
          <p className="mt-4 max-w-[52ch] text-pretty text-[13px] leading-relaxed text-[var(--dm-text-faint)]">
            This is prep to bring into the aircraft with your instructor — not a substitute for in-aircraft instruction.
          </p>
        </SessionCard>
      ) : null}

      {state === "radio-train" || state === "radio-diagnose" ? (
        <SessionCard>
          <CardEyebrow icon={Radio}>{state === "radio-train" ? "Let’s rehearse this on the radio" : "Let’s find out more"}</CardEyebrow>
          <CardHeadline>{state === "radio-train" ? "Realistic ATC scenarios" : "One real radio call"}</CardHeadline>
          <div className="mt-4">
            <AudioCue />
          </div>
          <CardBody>
            {state === "radio-train"
              ? "Graded on what you actually said, not a script — this is the same practice a real controller would expect."
              : "What you actually say tells us more than describing the problem would — respond like you would in the airplane."}
          </CardBody>
          <PrimaryCta>Start Radio Practice</PrimaryCta>
        </SessionCard>
      ) : null}

      {state === "radio-retry" ? (
        <SessionCard>
          <CardEyebrow icon={Radio}>Here&rsquo;s what to work on</CardEyebrow>
          <CardHeadline>Almost — one thing to fix</CardHeadline>
          <div className="mt-4 rounded-2xl border-l-[3px] border-[var(--dm-evidence-rule)] bg-[var(--dm-evidence-bg)] p-4">
            <p className="text-pretty text-[15px] leading-relaxed text-[var(--dm-text)]">
              You missed: <span className="font-semibold">{RADIO_MISSED_ELEMENT}</span>.
            </p>
          </div>
          <PrimaryCta>Try that again</PrimaryCta>
        </SessionCard>
      ) : null}

      {state === "coach" ? (
        <SessionCard>
          <CardEyebrow icon={Lightbulb}>Here&rsquo;s what to work on</CardEyebrow>
          <p className="mt-3 max-w-[56ch] text-pretty text-[19px] leading-relaxed text-[var(--dm-text)] xl:text-[21px]">{COACH_MESSAGE}</p>
          <div className="mt-5 max-w-[420px] rounded-2xl bg-[var(--dm-surface-muted)] p-4">
            <AileronEffectivenessDiagram />
          </div>
          <NextFlightObjective objective="Next flight, notice how much more aileron it takes to hold the same bank as you slow down for landing." />
          <QuietCta>Done</QuietCta>
        </SessionCard>
      ) : null}

      {state === "transfer" ? (
        <div className="rounded-[28px] border border-dashed border-[var(--dm-border)] bg-[var(--dm-surface)] p-6 md:p-8 xl:p-10">
          <CardEyebrow icon={PlaneTakeoff}>Take this into your next flight</CardEyebrow>
          <CardBody>{TRANSFER_OBJECTIVE}</CardBody>
          <QuietCta>Done</QuietCta>
        </div>
      ) : null}

      {state === "check-asking" || state === "check-loading" ? (
        <SessionCard>
          <CardEyebrow icon={MessageCircleQuestion}>One question before your next flight</CardEyebrow>
          <p className="mt-3 max-w-[52ch] text-pretty text-[19px] leading-snug text-[var(--dm-text)] xl:text-[21px]">{CHECK_QUESTION}</p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={state === "check-loading"}
            placeholder="Answer in your own words…"
            rows={4}
            className={cn(
              "mt-4 w-full rounded-2xl border border-[var(--dm-border)] bg-[var(--dm-surface-muted)] px-4 py-3 text-[16px] leading-relaxed text-[var(--dm-text)] outline-none transition-colors placeholder:text-[var(--dm-text-faint)] focus:border-[var(--dm-accent)] disabled:opacity-60",
            )}
          />
          <p className="mt-2 text-[13px] text-[var(--dm-text-faint)]">There&rsquo;s no wrong length — a sentence is plenty.</p>
          <PrimaryCta loading={state === "check-loading"}>{state === "check-loading" ? "Checking your answer" : "Get feedback"}</PrimaryCta>
        </SessionCard>
      ) : null}

      {state === "check-result" ? (
        <SessionCard>
          <CardEyebrow icon={CheckCircle2}>Feedback</CardEyebrow>
          <CardBody>{CHECK_RESULT.feedback}</CardBody>
          <div className="mt-5 max-w-[420px] rounded-2xl bg-[var(--dm-surface-muted)] p-4">
            <AileronEffectivenessDiagram />
          </div>
          <NextFlightObjective objective={CHECK_RESULT.takeaway} />
          <a
            href={CHECK_RESULT.citation.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center gap-1.5 text-[13px] text-[var(--dm-text-faint)] underline-offset-2 hover:underline"
          >
            Based on {CHECK_RESULT.citation.source}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
          <QuietCta>Done</QuietCta>
        </SessionCard>
      ) : null}

      {state === "check-error" ? (
        <SessionCard>
          <CardEyebrow icon={AlertCircle}>Couldn&rsquo;t reach Vector</CardEyebrow>
          <CardBody>That didn&rsquo;t go through — your answer wasn&rsquo;t lost. Try sending it again.</CardBody>
          <PrimaryCta>Try again</PrimaryCta>
        </SessionCard>
      ) : null}
    </div>
  );
}
