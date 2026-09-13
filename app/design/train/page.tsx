import { DesignThemeProvider } from "@/components/design/design-theme";
import { DesignStudentShell } from "@/components/design/design-student-shell";
import { DesignTrainHeader } from "@/components/design/design-train-header";
import { DesignTrainDeck } from "@/components/design/design-train-deck";
import { DesignStillWorkingOn } from "@/components/design/design-still-working-on";
import { CONTEXT_LINE, CONTEXT_SUBLINE, DECK, STILL_WORKING_ON } from "@/lib/design/train-fixtures";

function DesignSectionLabel({ children }: { children: string }) {
  return <p className="px-1 text-[14px] font-bold uppercase tracking-[0.08em] text-[var(--dm-text-soft)]">{children}</p>;
}

/**
 * Train's own IA, second pass: one swipeable/indexed deck across everything
 * from this debrief -- Vector's ranking only decides which card you land on
 * first, not which tier a unit is sorted into. Still Working On sits below
 * the deck, unchanged from the debrief-scoped plan: it's the longer-running
 * picture across flights, not today's plan.
 */
export default function DesignTrainPage() {
  return (
    <DesignThemeProvider>
      <DesignStudentShell>
        <div className="flex flex-col gap-8 pb-6 xl:gap-10">
          <DesignTrainHeader contextLine={CONTEXT_LINE} subline={CONTEXT_SUBLINE} />

          <DesignTrainDeck items={DECK} />

          <section className="flex flex-col gap-3">
            <DesignSectionLabel>Still working on</DesignSectionLabel>
            <DesignStillWorkingOn items={STILL_WORKING_ON} />
          </section>
        </div>
      </DesignStudentShell>
    </DesignThemeProvider>
  );
}
