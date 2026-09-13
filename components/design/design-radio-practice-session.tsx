"use client";

import { useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, Mic, Square, Volume2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { RADIO_SCENARIO } from "@/lib/design/vector-session-fixtures";

type Phase = "ready" | "call-playing" | "call-played" | "recording" | "submitting" | "done";

/**
 * Mirrors the real components/radio-practice-session.tsx phase sequence
 * exactly: ready -> call-playing -> call-played -> recording -> submitting
 * -> done. There's no real audio here (no getUserMedia, no Deepgram) --
 * this is a sketch of the visual sequence, so both phases are simulated on
 * a timer and the transcript is deterministic. The first submission is
 * deliberately incomplete (mirrors the real per-element phrase-matched
 * scoring, not an AI judgment call -- see lib/radio-practice-scoring.ts's
 * own design intent) so the sketch can show both the retry path and the
 * clean pass without needing real speech recognition.
 */
export function DesignRadioPracticeSession({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [attempt, setAttempt] = useState<1 | 2>(1);
  const scenario = RADIO_SCENARIO;

  const transcript = attempt === 1 ? scenario.firstAttemptTranscript : scenario.secondAttemptTranscript;
  const matched = attempt === 1 ? scenario.firstAttemptMatched : scenario.requiredElements.map(() => true);
  const correct = matched.every(Boolean);

  function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function playCall() {
    setPhase("call-playing");
    await wait(1400);
    setPhase("call-played");
  }

  async function record() {
    setPhase("recording");
    await wait(1800);
    setPhase("submitting");
    await wait(700);
    setPhase("done");
  }

  function tryAgain() {
    setAttempt(2);
    setPhase("ready");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[28px] border border-[var(--dm-border)] bg-[var(--dm-surface-elevated)] p-6 shadow-[var(--dm-shadow)] md:p-8 xl:p-10">
        <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--dm-accent)]">Radio Practice</p>
        <p className="mt-1.5 text-pretty text-[22px] font-semibold leading-snug tracking-[-0.01em] text-[var(--dm-text)] xl:text-[26px]">{scenario.title}</p>
        <p className="mt-1.5 text-pretty text-[15px] leading-relaxed text-[var(--dm-text-soft)]">{scenario.setup}</p>

        <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl bg-[var(--dm-surface-muted)] p-6">
          <button
            type="button"
            onClick={playCall}
            disabled={phase === "call-playing"}
            className="flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full bg-[var(--dm-accent)] px-5 text-[15px] font-semibold text-[var(--dm-on-accent)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {phase === "call-playing" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
            {phase === "call-playing" ? "Playing…" : "Play ATC Call"}
          </button>

          {phase === "call-playing" ? (
            <div className="flex h-8 items-center gap-1" role="img" aria-label="ATC call audio playing">
              {[10, 22, 15, 28, 12, 24, 18].map((h, i) => (
                <span key={i} className="w-1.5 rounded-full bg-[var(--dm-accent)] opacity-70" style={{ height: `${h}px` }} />
              ))}
            </div>
          ) : null}

          {phase === "recording" ? (
            <div className="flex w-full flex-col items-center gap-3">
              <div className="flex h-8 items-center gap-1" role="img" aria-label="Recording your readback">
                {[14, 26, 18, 30, 16, 28, 20, 24].map((h, i) => (
                  <span key={i} className="w-1.5 animate-pulse rounded-full bg-[var(--dm-evidence-rule)]" style={{ height: `${h}px` }} />
                ))}
              </div>
              <p className="min-h-[1.5rem] max-w-[40ch] text-pretty text-center text-[14px] text-[var(--dm-text-soft)]">Listening…</p>
              <button
                type="button"
                onClick={record}
                className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-[var(--dm-border)] px-4 text-[14px] font-medium text-[var(--dm-text)] transition-colors hover:bg-[var(--dm-surface)]"
              >
                <Square className="size-3.5" aria-hidden />
                Stop &amp; Submit
              </button>
            </div>
          ) : phase === "call-played" ? (
            <button
              type="button"
              onClick={record}
              className="flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full bg-[var(--dm-state-improving)] px-5 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Mic className="size-4" aria-hidden />
              Record Your Readback
            </button>
          ) : null}

          {phase === "submitting" ? <Loader2 className="size-5 animate-spin text-[var(--dm-accent)]" aria-hidden /> : null}
        </div>
      </div>

      <div className="rounded-[28px] border border-[var(--dm-border)] bg-[var(--dm-surface-elevated)] p-6 shadow-[var(--dm-shadow)] md:p-8 xl:p-10">
        <p className="text-[15px] font-semibold text-[var(--dm-text)]">What&rsquo;s Being Checked</p>
        <ul className="mt-3 flex flex-col gap-2">
          {scenario.requiredElements.map((el, i) => {
            const isMatched = phase === "done" ? matched[i] : undefined;
            return (
              <li key={el} className="flex items-start gap-2 text-pretty text-[15px] leading-snug text-[var(--dm-text-soft)]">
                {phase === "done" ? (
                  isMatched ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--dm-state-improving)]" aria-hidden />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-[var(--dm-evidence-rule)]" aria-hidden />
                  )
                ) : (
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--dm-text-faint)]" aria-hidden />
                )}
                {el}
              </li>
            );
          })}
        </ul>
      </div>

      {phase === "done" ? (
        <div className="rounded-[28px] border border-[var(--dm-border)] bg-[var(--dm-surface-elevated)] p-6 shadow-[var(--dm-shadow)] md:p-8 xl:p-10">
          <p className="text-[15px] font-semibold text-[var(--dm-text)]">What You Said</p>
          <p className="mt-1.5 text-pretty text-[15px] leading-relaxed text-[var(--dm-text-soft)]">&ldquo;{transcript}&rdquo;</p>
        </div>
      ) : null}

      {phase === "done" ? (
        <div
          className={cn(
            "rounded-[28px] border p-6 shadow-[var(--dm-shadow)] md:p-8 xl:p-10",
            correct ? "border-[var(--dm-state-improving)]" : "border-[var(--dm-evidence-rule)]",
          )}
        >
          <p className={cn("text-[17px] font-semibold", correct ? "text-[var(--dm-state-improving)]" : "text-[var(--dm-evidence-rule)]")}>
            {correct ? "Nailed it." : "Not quite — here's a model readback:"}
          </p>
          <p className="mt-2 text-pretty text-[15px] leading-relaxed text-[var(--dm-text)]">{scenario.modelReadback}</p>
          {!correct ? (
            <p className="mt-2 text-pretty text-[14px] leading-relaxed text-[var(--dm-text-soft)]">{scenario.coaching}</p>
          ) : null}
          <a
            href="https://www.faa.gov/air_traffic/publications/atpubs/aim_html/"
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center gap-1.5 text-[13px] text-[var(--dm-text-faint)] underline-offset-2 hover:underline"
          >
            Source: {scenario.source}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>

          <div className="mt-5 flex flex-col gap-2">
            {correct ? (
              <button
                type="button"
                onClick={onExit}
                className="flex min-h-[52px] w-full cursor-pointer items-center justify-center rounded-2xl bg-[var(--dm-accent)] px-5 text-[16px] font-semibold text-[var(--dm-on-accent)] transition-opacity hover:opacity-90"
              >
                Continue with Vector
              </button>
            ) : (
              <button
                type="button"
                onClick={tryAgain}
                className="flex min-h-[52px] w-full cursor-pointer items-center justify-center rounded-2xl bg-[var(--dm-accent)] px-5 text-[16px] font-semibold text-[var(--dm-on-accent)] transition-opacity hover:opacity-90"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
