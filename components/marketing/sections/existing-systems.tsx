import { ArrowDown } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

/**
 * Not currently rendered on the homepage -- its scheduling-integration
 * reassurance ("keep the systems you already use") is a distinct claim from
 * the training-continuity narrative the homepage now leads with, and adding
 * it here would just be more page length on the same point. Reserved for a
 * future integrations-focused page/section instead of deleted, since the
 * copy is still accurate (Flight Schedule Pro integration is still planned).
 */

const SCHEDULING_ITEMS = ["Students", "CFIs", "Aircraft", "Reservations"];
const AFTERFLIGHT_ITEMS = ["Flight Context", "Training History", "CFI Feedback", "Action Items", "Next Flight Brief"];

export function ExistingSystems() {
  return (
    <section className="border-t border-hairline bg-surface-sunken px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <Reveal className="text-center">
          <p className="text-balance text-xs font-bold uppercase tracking-[0.16em] text-brand">Works with what you have</p>
          <h2 className="font-display mt-3 text-balance text-4xl font-extrabold uppercase leading-[1.02] text-foreground sm:text-5xl">
            Keep the systems you already use.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-balance text-[17px] leading-relaxed text-foreground-soft">
            Your scheduling platform handles the operation. AfterFlight handles the training continuity.
          </p>
        </Reveal>

        <Reveal delay={150} className="mx-auto mt-12 flex max-w-xs flex-col items-center gap-3">
          <div className="w-full rounded-lg border border-hairline bg-surface p-5 text-center">
            <p className="text-balance text-xs font-semibold uppercase tracking-wide text-foreground-faint">Scheduling system</p>
            <p className="text-balance mt-2 text-sm text-foreground-soft">{SCHEDULING_ITEMS.join(" · ")}</p>
          </div>

          <ArrowDown className="size-5 text-foreground-faint" />

          <div className="w-full rounded-lg border border-brand p-5 text-center">
            <p className="font-display text-sm font-extrabold uppercase tracking-wide text-brand">AfterFlight</p>
            <p className="text-balance mt-2 text-sm text-foreground-soft">{AFTERFLIGHT_ITEMS.join(" · ")}</p>
          </div>

          <p className="text-balance mt-3 text-xs text-foreground-faint">Flight Schedule Pro integration planned.</p>
        </Reveal>
      </div>
    </section>
  );
}
