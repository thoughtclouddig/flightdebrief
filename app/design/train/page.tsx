"use client";

import { useState } from "react";
import { DesignThemeProvider } from "@/components/design/design-theme";
import { DesignStudentShell } from "@/components/design/design-student-shell";
import { DesignTrainHeader } from "@/components/design/design-train-header";
import { DesignTrainDeck } from "@/components/design/design-train-deck";
import { DesignStillWorkingOn } from "@/components/design/design-still-working-on";
import { DesignTrainEmptyState, DesignTrainErrorState, DesignTrainLoadingState } from "@/components/design/design-train-states";
import { CONTEXT_LINE, CONTEXT_SUBLINE, DECK, STILL_WORKING_ON } from "@/lib/design/train-fixtures";

type PageState = "populated" | "empty" | "loading" | "error";

const PAGE_STATE_LABELS: Record<PageState, string> = {
  populated: "Populated",
  empty: "Empty (real copy)",
  loading: "Loading (proposal)",
  error: "Error (proposal)",
};

function DesignSectionLabel({ children }: { children: string }) {
  return <p className="px-1 text-[14px] font-bold uppercase tracking-[0.08em] text-[var(--dm-text-soft)]">{children}</p>;
}

/**
 * Train's own IA, second pass: one swipeable/indexed deck across everything
 * from this debrief -- Vector's ranking only decides which card you land on
 * first, not which tier a unit is sorted into. Still Working On sits below
 * the deck, unchanged from the debrief-scoped plan: it's the longer-running
 * picture across flights, not today's plan.
 *
 * The page-state switcher below is dev-only review scaffolding (same idea
 * as /design/train-vector's), not part of the design -- it exists so
 * empty/loading/error can be reviewed without needing to fake a real
 * account state. Empty is real production copy; loading/error are
 * proposals, since production Train has neither today.
 */
export default function DesignTrainPage() {
  const [pageState, setPageState] = useState<PageState>("populated");
  const states = Object.keys(PAGE_STATE_LABELS) as PageState[];

  return (
    <DesignThemeProvider>
      <DesignStudentShell>
        <div className="flex flex-col gap-6 pb-6">
          <div className="flex flex-wrap gap-2">
            {states.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setPageState(s)}
                className={
                  s === pageState
                    ? "rounded-full bg-[var(--dm-accent)] px-3 py-1.5 text-[13px] font-semibold text-[var(--dm-on-accent)]"
                    : "rounded-full border border-[var(--dm-border)] px-3 py-1.5 text-[13px] font-medium text-[var(--dm-text-soft)] hover:bg-[var(--dm-surface-muted)]"
                }
              >
                {PAGE_STATE_LABELS[s]}
              </button>
            ))}
          </div>

          {pageState === "loading" ? (
            <DesignTrainLoadingState />
          ) : pageState === "error" ? (
            <>
              <DesignTrainHeader contextLine={CONTEXT_LINE} subline={CONTEXT_SUBLINE} />
              <DesignTrainErrorState />
            </>
          ) : pageState === "empty" ? (
            <>
              <DesignTrainHeader contextLine={CONTEXT_LINE} subline={CONTEXT_SUBLINE} />
              <DesignTrainEmptyState />
            </>
          ) : (
            <div className="flex flex-col gap-8 xl:gap-10">
              <DesignTrainHeader contextLine={CONTEXT_LINE} subline={CONTEXT_SUBLINE} />

              <DesignTrainDeck items={DECK} />

              <section className="flex flex-col gap-3">
                <DesignSectionLabel>Still working on</DesignSectionLabel>
                <DesignStillWorkingOn items={STILL_WORKING_ON} />
              </section>
            </div>
          )}
        </div>
      </DesignStudentShell>
    </DesignThemeProvider>
  );
}
