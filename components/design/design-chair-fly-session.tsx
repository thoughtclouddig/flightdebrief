"use client";

import { useState } from "react";
import { ArrowRight, Check, PlaneTakeoff } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHAIR_FLY_DRILL } from "@/lib/design/vector-session-fixtures";

/**
 * Mirrors the real components/student/chair-fly-session.tsx exactly: one
 * step at a time (the previous one is gone, not scrolled-to), NO
 * right/wrong marking on any option -- a response reinforces or corrects
 * the reasoning, it never scores it. Local state only; nothing here calls
 * a real evaluator.
 */
export function DesignChairFlySession({ onExit }: { onExit: () => void }) {
  const [stage, setStage] = useState<"intro" | "running" | "complete">("intro");
  const [index, setIndex] = useState(0);
  const [chosenId, setChosenId] = useState<string | null>(null);

  const drill = CHAIR_FLY_DRILL;
  const step = drill.steps[index];

  function advance() {
    setChosenId(null);
    if (index + 1 >= drill.steps.length) {
      setStage("complete");
      return;
    }
    setIndex(index + 1);
  }

  if (stage === "intro") {
    return (
      <div className="rounded-[28px] border border-[var(--dm-border)] bg-[var(--dm-surface-elevated)] p-6 shadow-[var(--dm-shadow)] md:p-8 xl:p-10">
        <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--dm-accent)]">Why this drill</p>
        <p className="mt-1.5 text-pretty text-[22px] font-semibold leading-snug tracking-[-0.01em] text-[var(--dm-text)] xl:text-[26px]">
          You called it {drill.reason.studentLabel}. {drill.reason.instructorName} called it{" "}
          {drill.reason.instructorLabel}.
        </p>
        <p className="mt-2 text-[14px] text-[var(--dm-text-faint)]">
          {drill.scenario}{"\u00A0"}·{"\u00A0"}about{"\u00A0"}{drill.estimatedMinutes}{"\u00A0"}minutes
        </p>

        <div className="mt-5 rounded-2xl border-l-[3px] border-[var(--dm-evidence-rule)] bg-[var(--dm-evidence-bg)] p-4">
          <p className="text-pretty text-[15px] leading-relaxed text-[var(--dm-text)]">&ldquo;{drill.reason.evidence}&rdquo;</p>
          <p className="mt-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--dm-text-faint)]">
            {drill.reason.instructorName} · {drill.reason.date}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setStage("running")}
          className="mt-6 flex min-h-[52px] w-full max-w-[360px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[var(--dm-accent)] px-5 text-[17px] font-semibold text-[var(--dm-on-accent)] transition-opacity hover:opacity-90"
        >
          Begin
          <ArrowRight className="size-[18px]" aria-hidden />
        </button>

        <p className="mt-4 max-w-[52ch] text-pretty text-[13px] leading-relaxed text-[var(--dm-text-faint)]">
          Vector sets the situation and asks what you&rsquo;d do — {drill.steps.length} of them, starting where your last flight ended. {drill.guardrail}
        </p>
      </div>
    );
  }

  if (stage === "complete") {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-[28px] border border-[var(--dm-border)] bg-[var(--dm-surface-elevated)] p-6 shadow-[var(--dm-shadow)] md:p-8 xl:p-10">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--dm-accent)]">
            <Check className="size-4 shrink-0" aria-hidden />
            Chair flying complete
          </p>
          <p className="mt-1.5 text-[22px] font-semibold leading-snug tracking-[-0.01em] text-[var(--dm-text)] xl:text-[26px]">
            {drill.objective}
          </p>
          <p className="mt-1 text-[14px] text-[var(--dm-text-faint)]">{drill.scenario}</p>

          <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--dm-text-soft)]">Remember next flight</p>
          <ul className="mt-3 flex flex-col gap-3">
            {drill.carryForward.map((c) => (
              <li key={c} className="flex items-start gap-3 text-pretty text-[16px] leading-snug text-[var(--dm-text)]">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--dm-accent)]" aria-hidden />
                {c}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-start gap-3 border-t border-[var(--dm-border)] pt-5">
            <PlaneTakeoff className="mt-1 size-[18px] shrink-0 text-[var(--dm-accent)]" aria-hidden />
            <div className="min-w-0">
              <p className="text-[16px] font-medium text-[var(--dm-text)]">
                {drill.nextFlight.when} · {drill.nextFlight.lesson}
              </p>
              <p className="mt-1 text-pretty text-[14px] leading-relaxed text-[var(--dm-text-soft)]">Focus: {drill.nextFlight.focus}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onExit}
            className="mt-6 flex min-h-[52px] w-full max-w-[360px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[var(--dm-accent)] px-5 text-[17px] font-semibold text-[var(--dm-on-accent)] transition-opacity hover:opacity-90"
          >
            See my next flight
            <ArrowRight className="size-[18px]" aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  if (!step) return null;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] font-medium tabular-nums text-[var(--dm-text-faint)]">
        Step {index + 1} of {drill.steps.length}
      </p>

      <div className="flex flex-col gap-5 rounded-[28px] border border-[var(--dm-border)] bg-[var(--dm-surface-elevated)] p-6 shadow-[var(--dm-shadow)] md:p-8 xl:p-10">
        <p className="text-pretty text-[16px] leading-relaxed text-[var(--dm-text-soft)]">{step.scene}</p>
        <p className="text-pretty text-[19px] font-semibold leading-snug tracking-[-0.01em] text-[var(--dm-text)] xl:text-[21px]">
          {step.prompt}
        </p>

        <div className="flex flex-col gap-2.5">
          {step.options.map((o) => {
            const picked = chosenId === o.id;
            return (
              <button
                key={o.id}
                type="button"
                disabled={Boolean(chosenId)}
                onClick={() => !chosenId && setChosenId(o.id)}
                aria-pressed={picked}
                className={cn(
                  "min-h-[52px] rounded-2xl border px-4 py-3 text-left text-[15px] leading-snug transition-colors duration-200",
                  // No right/wrong coloring here, ever -- see the module doc comment.
                  picked
                    ? "cursor-default border-[var(--dm-text)] bg-[var(--dm-surface-muted)] text-[var(--dm-text)]"
                    : chosenId
                      ? "cursor-default border-[var(--dm-border)] text-[var(--dm-text-faint)]"
                      : "cursor-pointer border-[var(--dm-border)] text-[var(--dm-text)] hover:bg-[var(--dm-surface-muted)]",
                )}
              >
                {o.text}
              </button>
            );
          })}
        </div>

        {chosenId ? (
          <div className="flex flex-col gap-4 border-t border-[var(--dm-border)] pt-5">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--dm-accent)]">Vector</p>
              <p className="mt-1.5 text-pretty text-[15px] leading-relaxed text-[var(--dm-text)]">
                {step.options.find((o) => o.id === chosenId)?.response}
              </p>
            </div>

            {step.instructorNote ? (
              <div className="rounded-2xl border-l-[3px] border-[var(--dm-evidence-rule)] bg-[var(--dm-evidence-bg)] p-4">
                <p className="text-pretty text-[15px] leading-relaxed text-[var(--dm-text)]">{step.instructorNote}</p>
                <p className="mt-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--dm-text-faint)]">
                  {drill.reason.instructorName} · {drill.reason.date}
                </p>
              </div>
            ) : null}

            <p className="rounded-xl bg-[var(--dm-surface-muted)] px-4 py-3.5 text-pretty text-[14px] leading-relaxed text-[var(--dm-text-soft)]">
              {step.coaching}
            </p>
          </div>
        ) : null}
      </div>

      {chosenId ? (
        <button
          type="button"
          onClick={advance}
          className="flex min-h-[52px] w-full max-w-[360px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[var(--dm-accent)] px-5 text-[17px] font-semibold text-[var(--dm-on-accent)] transition-opacity hover:opacity-90"
        >
          {index + 1 >= drill.steps.length ? "Finish" : "Continue"}
          <ArrowRight className="size-[18px]" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
