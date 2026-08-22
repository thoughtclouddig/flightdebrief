"use client";

import { useState, useSyncExternalStore } from "react";
import { Compass, PlaneTakeoff, MessageSquareQuote, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Bump this suffix to reshow the walkthrough after a content change that's
// worth re-surfacing; unrelated to profileCompleted, which gates the
// mandatory name-confirmation step, not this optional tour.
const STORAGE_KEY_PREFIX = "af_walkthrough_seen_v1_";

const STEPS = [
  {
    icon: Compass,
    title: "Welcome to AfterFlight",
    body: "Let's take a quick look around before your first flight.",
  },
  {
    icon: PlaneTakeoff,
    title: "Log a flight after you land",
    body: "Once you're back on the ground, log the flight here -- tail number, route, how long you flew.",
  },
  {
    icon: MessageSquareQuote,
    title: "Debrief it with your CFI",
    body: "You and your instructor each say what went well and what to work on -- then walk through it together.",
  },
  {
    icon: TrendingUp,
    title: "Watch your progress build",
    body: "Every debrief adds to your training history, so patterns across flights actually show up.",
  },
] as const;

function storageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function noopSubscribe() {
  return () => {};
}

/**
 * localStorage is an external, mutable data source -- useSyncExternalStore
 * (rather than reading it in a useEffect + setState) is the pattern React
 * itself recommends for this, and it naturally renders `false` on the server
 * snapshot so there's no hydration flash of the modal.
 */
function useSeenWalkthrough(userId: string): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return window.localStorage.getItem(storageKey(userId)) === "1";
      } catch {
        return true; // storage unavailable (private browsing, etc.) -- don't show
      }
    },
    () => true,
  );
}

export function StudentWalkthrough({ userId }: { userId: string }) {
  const seen = useSeenWalkthrough(userId);
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState(0);

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(storageKey(userId), "1");
    } catch {
      /* nothing to persist to, but don't block dismissal */
    }
  }

  if (seen || dismissed) return null;

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm">
      <div className="flex justify-end p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Skip walkthrough"
          className="flex size-10 items-center justify-center rounded-full text-foreground-faint hover:bg-surface-sunken hover:text-foreground"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Icon className="size-8" />
        </div>
        <div className="flex max-w-xs flex-col gap-2">
          <h2 className="text-xl font-semibold text-foreground">{current.title}</h2>
          <p className="text-sm text-foreground-soft">{current.body}</p>
        </div>

        <div className="flex items-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn("size-1.5 rounded-full transition-colors", i === step ? "bg-brand" : "bg-hairline")}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <Button size="lg" onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}>
          {isLast ? "Let's fly" : "Next"}
        </Button>
        {step > 0 && !isLast ? (
          <Button size="lg" variant="ghost" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        ) : null}
      </div>
    </div>
  );
}
