"use client";

import { useState } from "react";
import {
  AlertCircle,
  Brain,
  Check,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  ListChecks,
  Loader2,
  MessageCircleQuestion,
  PlaneTakeoff,
  Radio,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DesignChairFlySession } from "@/components/design/design-chair-fly-session";
import { DesignRadioPracticeSession } from "@/components/design/design-radio-practice-session";
import { AudioCue } from "@/components/design/design-vector-diagrams";
import {
  CHECK_QUESTION,
  CHECK_RESULT,
  COACH_MESSAGE,
  RADIO_MISSED_ELEMENT,
  RECALL_QUESTIONS,
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

function CardEyebrow({ icon: Icon, children }: { icon: typeof Brain; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--dm-accent)]">
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

function CardHeadline({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-1.5 text-[26px] font-semibold leading-[1.1] tracking-[-0.01em] text-[var(--dm-text)] xl:text-[30px]">{children}</h2>;
}

function CardBody({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 max-w-[56ch] text-pretty text-[16px] leading-relaxed text-[var(--dm-text-soft)]">{children}</p>;
}

function PrimaryCta({
  children,
  loading = false,
  onClick,
}: {
  children: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[var(--dm-accent)] px-5 text-[17px] font-semibold text-[var(--dm-on-accent)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={loading}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

function QuietCta({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 flex min-h-[52px] w-full cursor-pointer items-center justify-center rounded-2xl border border-[var(--dm-border)] px-5 text-[17px] font-semibold text-[var(--dm-text)] transition-colors hover:bg-[var(--dm-surface-muted)]"
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
    <div className="mt-5 rounded-2xl border border-dashed border-[var(--dm-border)] bg-[var(--dm-surface-muted)] p-4">
      <p className="flex items-start gap-1.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--dm-text-soft)]">
        <PlaneTakeoff className="mt-0.5 size-3 shrink-0 text-[var(--dm-accent)]" aria-hidden />
        <span>Take this into your next flight</span>
      </p>
      <p className="mt-1.5 text-pretty text-[15px] leading-relaxed text-[var(--dm-text)]">{objective}</p>
    </div>
  );
}

/**
 * SKETCH ONLY -- speculative, not a real Vector state. See
 * lib/design/vector-session-fixtures.ts's RECALL_QUESTIONS doc comment for
 * the full rationale. Deliberately reuses the radio-retry "you missed"
 * evidence-bg treatment for a wrong answer and the coach state's
 * --dm-state-improving hue for a right one, rather than inventing a third
 * semantic color the rest of this design system doesn't have.
 */
function DesignRecallCheck() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <SessionCard>
        <CardEyebrow icon={ListChecks}>Quick recall — sketch</CardEyebrow>
        <CardHeadline>That&rsquo;s the idea</CardHeadline>
        <CardBody>
          A couple of fast, low-stakes questions on the same skill Vector just covered — still no score, just a quick check that it stuck before you move on.
        </CardBody>
        <QuietCta>Done</QuietCta>
      </SessionCard>
    );
  }

  const question = RECALL_QUESTIONS[index]!;
  const isLast = index === RECALL_QUESTIONS.length - 1;

  return (
    <SessionCard>
      <CardEyebrow icon={ListChecks}>
        Quick recall — sketch · {index + 1} of {RECALL_QUESTIONS.length}
      </CardEyebrow>
      <p className="mt-3 max-w-[52ch] text-pretty text-[19px] leading-snug text-[var(--dm-text)] xl:text-[21px]">{question.prompt}</p>
      <div className="mt-4 flex flex-col gap-2">
        {question.options.map((option, i) => {
          const isCorrectOption = i === question.correctIndex;
          const isPicked = selected === i;
          const revealed = selected !== null;
          return (
            <button
              key={option}
              type="button"
              disabled={revealed}
              onClick={() => setSelected((prev) => (prev === null ? i : prev))}
              className={cn(
                "flex min-h-[52px] w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-[15px] leading-snug transition-colors",
                !revealed && "cursor-pointer border-[var(--dm-border)] text-[var(--dm-text)] hover:bg-[var(--dm-surface-muted)]",
                revealed && isCorrectOption && "border-[var(--dm-state-improving)] bg-[var(--dm-state-improving)]/10 text-[var(--dm-text)]",
                revealed && isPicked && !isCorrectOption && "border-[var(--dm-evidence-rule)] bg-[var(--dm-evidence-bg)] text-[var(--dm-text)]",
                revealed && !isPicked && !isCorrectOption && "cursor-default border-[var(--dm-border)] text-[var(--dm-text-faint)] opacity-60",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border",
                  !revealed && "border-[var(--dm-border)]",
                  revealed && isCorrectOption && "border-[var(--dm-state-improving)] bg-[var(--dm-state-improving)] text-white",
                  revealed && isPicked && !isCorrectOption && "border-[var(--dm-evidence-rule)] bg-[var(--dm-evidence-rule)] text-white",
                  revealed && !isPicked && !isCorrectOption && "border-[var(--dm-border)]",
                )}
              >
                {revealed && isCorrectOption ? <Check className="size-3" /> : null}
                {revealed && isPicked && !isCorrectOption ? <X className="size-3" /> : null}
              </span>
              {option}
            </button>
          );
        })}
      </div>
      {selected !== null ? (
        <div className="mt-4 rounded-2xl border-l-[3px] border-[var(--dm-evidence-rule)] bg-[var(--dm-evidence-bg)] p-4">
          <p className="text-pretty text-[15px] leading-relaxed text-[var(--dm-text)]">{question.explanation}</p>
        </div>
      ) : null}
      {selected !== null ? (
        <PrimaryCta
          onClick={() => {
            if (isLast) {
              setDone(true);
            } else {
              setIndex((prev) => prev + 1);
              setSelected(null);
            }
          }}
        >
          {isLast ? "Done" : "Next question"}
        </PrimaryCta>
      ) : null}
    </SessionCard>
  );
}

export function DesignVectorSession({ state }: { state: DesignVectorState }) {
  const [answer, setAnswer] = useState("");
  // Which full in-session experience has taken over the screen, if any --
  // mirrors what really happens when "Rehearse with Vector" or "Start Radio
  // Practice" navigates to a separate route (/train/chair-fly,
  // /practice/[id]). Independent of `state`, since the real app doesn't
  // keep the Vector card mounted underneath either.
  const [activeSession, setActiveSession] = useState<"chair-fly" | "radio-practice" | null>(null);

  if (activeSession === "chair-fly") {
    return <DesignChairFlySession onExit={() => setActiveSession(null)} />;
  }
  if (activeSession === "radio-practice") {
    return <DesignRadioPracticeSession onExit={() => setActiveSession(null)} />;
  }

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
      </div>

      {state === "chair-fly" ? (
        <SessionCard>
          <CardEyebrow icon={Brain}>Chair Fly — let&rsquo;s rehearse this</CardEyebrow>
          <CardHeadline>Fly it in your head first</CardHeadline>
          <CardBody>
            I&rsquo;ll set the scene and stop at each decision point — you fly it in your head before you fly it for real.
          </CardBody>
          <PrimaryCta onClick={() => setActiveSession("chair-fly")}>Rehearse with Vector</PrimaryCta>
          <p className="mt-4 text-pretty text-[13px] leading-relaxed text-[var(--dm-text-faint)]">
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
              ? "Graded on what you actually said, not a script — this is the same practice a real controller would expect."
              : "What you actually say tells us more than describing the problem would — respond like you would in the airplane."}
          </CardBody>
          <PrimaryCta onClick={() => setActiveSession("radio-practice")}>Start Radio Practice</PrimaryCta>
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
          <CardEyebrow icon={MessageCircleQuestion}>Before your next flight</CardEyebrow>
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

      {state === "recall" ? <DesignRecallCheck /> : null}
    </div>
  );
}
