"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, LifeBuoy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EDUCATION_TOPICS, type GuideStep } from "@/lib/guide";

const RADIUS = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Small ring that fills in as setup steps complete; once everything's done it quietly becomes a plain help icon -- no badge, no celebration. */
function ProgressRing({ complete, total, compact }: { complete: number; total: number; compact: boolean }) {
  const done = total > 0 && complete === total;
  const size = compact ? 22 : 24;

  if (done) {
    return <LifeBuoy className={compact ? "size-[18px]" : "size-5"} />;
  }

  const fraction = total > 0 ? complete / total : 0;
  const offset = CIRCUMFERENCE * (1 - fraction);

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
      <circle cx="12" cy="12" r={RADIUS} className="stroke-hairline" strokeWidth="2.5" fill="none" />
      <circle
        cx="12"
        cy="12"
        r={RADIUS}
        className="stroke-brand transition-all"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform="rotate(-90 12 12)"
      />
    </svg>
  );
}

export function GuideControl({ steps, variant }: { steps: GuideStep[]; variant: "desktop" | "mobile" }) {
  const [open, setOpen] = useState(false);
  const compact = variant === "mobile";
  const completeCount = steps.filter((s) => s.complete).length;
  const total = steps.length;
  const allDone = total > 0 && completeCount === total;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (total === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={allDone ? "AfterFlight Guide" : `AfterFlight Guide -- ${completeCount} of ${total} steps complete`}
        className={cn(
          "flex items-center gap-1.5 rounded-lg text-foreground-soft transition-colors hover:bg-surface-sunken hover:text-foreground",
          compact ? "size-9 justify-center" : "px-2 py-1.5",
        )}
      >
        <ProgressRing complete={completeCount} total={total} compact={compact} />
        {!compact && !allDone ? (
          <span className="text-xs font-medium tabular-nums">
            {completeCount}/{total}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-black/30"
          />
          <div
            role="dialog"
            aria-label="AfterFlight Guide"
            className={cn(
              "fixed z-50 flex flex-col border-hairline bg-surface shadow-xl",
              variant === "desktop"
                ? "inset-y-0 right-0 w-full max-w-sm border-l"
                : "inset-x-0 bottom-0 max-h-[88vh] rounded-t-2xl border-t pb-[env(safe-area-inset-bottom)]",
            )}
          >
            <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
              <div>
                <p className="font-display text-lg font-bold text-foreground">AfterFlight Guide</p>
                <p className="text-sm text-foreground-soft">Get more from every flight.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close Guide"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground-faint hover:bg-surface-sunken hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="flex flex-col gap-1">
                {steps.map((step) => (
                  <li key={step.key}>
                    <div className="flex items-start gap-3 rounded-lg px-2 py-2.5 -mx-2">
                      {step.complete ? (
                        <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-good" />
                      ) : (
                        <Circle className="mt-0.5 size-4.5 shrink-0 text-foreground-faint" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-semibold", step.complete ? "text-foreground-soft" : "text-foreground")}>
                          {step.title}
                        </p>
                        <p className="mt-0.5 text-xs text-foreground-soft">{step.description}</p>
                        {step.href && step.actionLabel ? (
                          <Link
                            href={step.href}
                            onClick={() => setOpen(false)}
                            className="mt-1.5 inline-block text-xs font-semibold text-brand hover:underline"
                          >
                            {step.actionLabel} &rarr;
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 border-t border-hairline pt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-foreground-faint">Learn AfterFlight</p>
                <ul className="mt-3 flex flex-col gap-3">
                  {EDUCATION_TOPICS.map((topic) => (
                    <li key={topic.key}>
                      <p className="text-sm font-semibold text-foreground">{topic.title}</p>
                      <p className="mt-0.5 text-xs text-foreground-soft">{topic.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
