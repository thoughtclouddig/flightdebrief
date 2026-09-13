"use client";

import { useState } from "react";
import { DesignThemeProvider } from "@/components/design/design-theme";
import { DesignStudentShell } from "@/components/design/design-student-shell";
import { DesignVectorSession } from "@/components/design/design-vector-session";
import { STATE_LABELS, type DesignVectorState } from "@/lib/design/vector-session-fixtures";

const STATES = Object.keys(STATE_LABELS) as DesignVectorState[];

/**
 * There is no real backend data behind this mockup (unlike Train's deck,
 * which at least has a plausible "here's what a real debrief produces"
 * story) -- the Vector session's whole point is that its state is decided
 * server-side from real evidence, so a state switcher is the only honest
 * way to browser-review all of it without faking a signed-in session.
 * Never shipped -- this control has no production equivalent.
 */
export default function DesignTrainVectorPage() {
  const [state, setState] = useState<DesignVectorState>("chair-fly");

  return (
    <DesignThemeProvider>
      <DesignStudentShell>
        <div className="flex flex-col gap-6 pb-10">
          <div className="flex flex-wrap gap-2">
            {STATES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setState(s)}
                className={
                  s === state
                    ? "rounded-full bg-[var(--dm-accent)] px-3 py-1.5 text-[13px] font-semibold text-[var(--dm-on-accent)]"
                    : "rounded-full border border-[var(--dm-border)] px-3 py-1.5 text-[13px] font-medium text-[var(--dm-text-soft)] hover:bg-[var(--dm-surface-muted)]"
                }
              >
                {STATE_LABELS[s]}
              </button>
            ))}
          </div>

          <DesignVectorSession state={state} />
        </div>
      </DesignStudentShell>
    </DesignThemeProvider>
  );
}
