"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { DesignThemeProvider } from "@/components/design/design-theme";
import { DesignStudentShell } from "@/components/design/design-student-shell";
import { DesignTrainHeader } from "@/components/design/design-train-header";
import { DesignTrainingUnitCard, DesignCompactTrainingUnit, DesignTransferCard } from "@/components/design/design-training-unit-card";
import {
  CONTEXT_LINE,
  CONTEXT_SUBLINE,
  CROSSWIND_LANDING,
  MORE_UNITS,
  SLOW_FLIGHT_KNOWLEDGE,
  STEEP_TURNS_TRANSFER,
  TOWER_COMMUNICATIONS,
} from "@/lib/design/train-fixtures";

function DesignSectionLabel({ children }: { children: string }) {
  return <p className="px-1 text-[14px] font-bold uppercase tracking-[0.08em] text-[var(--dm-text-soft)]">{children}</p>;
}

/**
 * The four required cases, laid out exactly as Train's own IA is proposed:
 * one rich Start Here unit, up to two compact Also Train units, progressive
 * disclosure for anything past that, and the transfer case kept visually
 * separate -- it is never "also train," it is the one place the app
 * deliberately does not offer another activity.
 */
export default function DesignTrainPage() {
  const [moreRevealed, setMoreRevealed] = useState(false);

  return (
    <DesignThemeProvider>
      <DesignStudentShell>
        <div className="flex flex-col gap-8 pb-6 xl:gap-10">
          <DesignTrainHeader contextLine={CONTEXT_LINE} subline={CONTEXT_SUBLINE} />

          <section className="flex flex-col gap-3">
            <DesignSectionLabel>Start here</DesignSectionLabel>
            <DesignTrainingUnitCard unit={CROSSWIND_LANDING} />
          </section>

          <section className="flex flex-col gap-3">
            <DesignSectionLabel>Also train</DesignSectionLabel>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <DesignCompactTrainingUnit unit={TOWER_COMMUNICATIONS} />
              <DesignCompactTrainingUnit unit={SLOW_FLIGHT_KNOWLEDGE} />
            </div>
          </section>

          {moreRevealed ? (
            <section className="flex flex-col gap-3">
              <DesignSectionLabel>More from this debrief</DesignSectionLabel>
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {MORE_UNITS.map((unit) => (
                  <DesignCompactTrainingUnit key={unit.id} unit={unit} />
                ))}
              </div>
            </section>
          ) : (
            <button
              onClick={() => setMoreRevealed(true)}
              className="-mt-4 flex items-center gap-1 self-start px-1 text-[15px] font-medium text-[var(--dm-accent)]"
            >
              View {MORE_UNITS.length} more from this debrief
              <ChevronRight className="size-4" aria-hidden />
            </button>
          )}

          <section className="flex flex-col gap-3">
            <DesignSectionLabel>Next flight</DesignSectionLabel>
            <DesignTransferCard unit={STEEP_TURNS_TRANSFER} />
          </section>
        </div>
      </DesignStudentShell>
    </DesignThemeProvider>
  );
}
