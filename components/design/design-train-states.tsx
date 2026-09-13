import { AlertCircle } from "lucide-react";

/**
 * Three states production Train doesn't have a design for today:
 *
 * - Empty is real and already shipped (components/student/student-train.tsx)
 *   -- just its exact copy, given the header/shell treatment the rest of
 *   this mockup uses.
 * - Loading and error are NOT built anywhere in production (Train is fully
 *   server-rendered with no loading.tsx/error.tsx under app/(product)/) --
 *   these two are proposals, not previews of something that exists.
 */

export function DesignTrainEmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[28px] border border-dashed border-[var(--dm-border)] px-6 py-16 text-center">
      <p className="max-w-[42ch] text-pretty text-[17px] leading-relaxed text-[var(--dm-text-soft)]">
        Nothing to train on yet — this fills in once your first debrief is finished.
      </p>
    </div>
  );
}

export function DesignTrainLoadingState() {
  return (
    <div className="flex flex-col gap-8" aria-busy aria-label="Loading your training plan">
      <div className="flex flex-col gap-3">
        <div className="h-3 w-40 animate-pulse rounded-full bg-[var(--dm-surface-muted)]" />
        <div className="h-8 w-64 max-w-full animate-pulse rounded-lg bg-[var(--dm-surface-muted)]" />
        <div className="h-4 w-52 max-w-full animate-pulse rounded-full bg-[var(--dm-surface-muted)]" />
      </div>
      <div className="h-[420px] animate-pulse rounded-[28px] border border-[var(--dm-border)] bg-[var(--dm-surface-elevated)]" />
    </div>
  );
}

export function DesignTrainErrorState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[28px] border border-dashed border-[var(--dm-border)] px-6 py-16 text-center">
      <AlertCircle className="size-6 text-[var(--dm-text-faint)]" aria-hidden />
      <p className="max-w-[42ch] text-pretty text-[17px] leading-relaxed text-[var(--dm-text)]">
        Couldn&rsquo;t load your training plan right now.
      </p>
      <p className="max-w-[42ch] text-pretty text-[14px] leading-relaxed text-[var(--dm-text-faint)]">
        Nothing you were working on was lost — try reloading in a moment.
      </p>
    </div>
  );
}
