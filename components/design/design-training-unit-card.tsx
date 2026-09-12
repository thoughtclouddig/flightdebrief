import type { ComponentType } from "react";
import { Compass, Gauge, PlaneTakeoff, Radio, Sparkles, Wind } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DesignTrainingUnit, DesignTransferUnit } from "@/lib/design/train-fixtures";

/** Keyed purely by fixture id -- a real build would key this off skill/category, but nothing here reads from a real image library. Restrained: an icon on a gradient plate, never a stock photo standing in for evidence. */
const HERO_ICON: Record<string, ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>> = {
  "crosswind-landing": Wind,
  "tower-communications": Radio,
  "slow-flight-knowledge": Gauge,
  "steep-turns-transfer": Compass,
  "short-field-landing": Wind,
  "airspace-knowledge": Compass,
};

function DesignHeroVisual({ unitId, className }: { unitId: string; className?: string }) {
  const Icon = HERO_ICON[unitId] ?? Compass;
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-[20px] bg-gradient-to-br from-[var(--dm-surface-muted)] to-[var(--dm-accent-soft)]",
        className,
      )}
    >
      <Icon className="size-12 text-[var(--dm-accent)] opacity-80 xl:size-14" strokeWidth={1.5} aria-hidden />
    </div>
  );
}

/** The instructor's own words, prominent and verbatim -- never paraphrased, never behind an accordion. A single oversized quotation glyph is the only decoration; everything else is restraint. */
export function DesignInstructorEvidence({ quote, instructorName, flightDate }: { quote: string; instructorName: string; flightDate: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-l-[3px] border-[var(--dm-evidence-rule)] bg-[var(--dm-evidence-bg)] py-4 pl-5 pr-4">
      <span aria-hidden className="pointer-events-none absolute -right-1 -top-3 select-none font-serif text-[64px] leading-none text-[var(--dm-accent)] opacity-[0.08]">
        {'"'}
      </span>
      <p className="relative max-w-[30ch] text-pretty text-[17px] italic leading-relaxed text-[var(--dm-text)] xl:text-[19px]">{quote}</p>
      <p className="relative mt-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--dm-text-faint)]">
        {instructorName} · {flightDate}
      </p>
    </div>
  );
}

/** The one action panel a Vector unit is allowed -- a recommended-treatment badge only when a real mechanism is known, the CTA always, a caption only when it earns its place. Never a second competing button. */
export function DesignVectorAction({
  recommendedTreatmentLabel,
  caption,
  compact = false,
}: {
  recommendedTreatmentLabel: string | null;
  caption?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {recommendedTreatmentLabel ? (
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--dm-text-soft)]">
          <Sparkles className="size-3.5 shrink-0 text-[var(--dm-accent)]" aria-hidden />
          {recommendedTreatmentLabel}
        </p>
      ) : null}
      <button
        type="button"
        className={cn(
          "flex min-h-[52px] w-full cursor-pointer items-center justify-center rounded-2xl bg-[var(--dm-accent)] px-5 font-semibold text-[var(--dm-on-accent)] transition-opacity hover:opacity-90",
          compact ? "text-[15px]" : "text-[17px]",
        )}
      >
        Train with Vector
      </button>
      {caption ? <p className="text-[13px] text-[var(--dm-text-faint)]">{caption}</p> : null}
    </div>
  );
}

/**
 * The one rich "Start here" unit.
 *
 * Mobile: hero visual, skill title, evidence, ACS status line, full-width
 * CTA -- one column, in that exact order.
 * Tablet (md-xl): the same column, but the action becomes its own bordered
 * panel rather than a button floating at the card's bottom edge.
 * Large desktop (xl+): a genuine three-part horizontal composition --
 * visual, skill/evidence, action panel -- since there is only ever one of
 * these on screen and it can afford real width.
 */
export function DesignTrainingUnitCard({ unit }: { unit: DesignTrainingUnit }) {
  return (
    <div className="rounded-[28px] border border-[var(--dm-border)] bg-[var(--dm-surface-elevated)] p-6 shadow-[var(--dm-shadow)] md:p-8 xl:p-10">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-stretch xl:gap-8">
        <DesignHeroVisual unitId={unit.id} className="h-36 w-full shrink-0 md:h-44 xl:h-auto xl:w-[220px]" />

        <div className="flex min-w-0 flex-1 flex-col gap-5 xl:flex-row xl:gap-8">
          <div className="min-w-0 xl:max-w-[42ch] xl:flex-1">
            <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--dm-accent)]">Start here</p>
            <h2 className="mt-1.5 text-[26px] font-semibold leading-[1.1] tracking-[-0.01em] text-[var(--dm-text)] xl:text-[30px]">
              {unit.skillLabel}
            </h2>
            <p className="mt-1.5 text-[13px] text-[var(--dm-text-faint)]">
              <span className="font-semibold uppercase tracking-[0.06em]">FAA ACS</span>
              <span className="px-1.5 opacity-60">·</span>
              {unit.acsArea}
            </p>
            <div className="mt-4">
              <DesignInstructorEvidence {...unit.evidence} />
            </div>
          </div>

          {/* The action panel: its own surface and border at md+ so it
              reads as a distinct zone of the card, not a button that
              happens to sit at the bottom -- "a clear training action
              panel" is a claim about hierarchy, not just about the button
              itself. */}
          <div className="rounded-2xl bg-[var(--dm-surface-muted)] p-5 md:border md:border-[var(--dm-border)] xl:w-[260px] xl:shrink-0 xl:self-start">
            <DesignVectorAction recommendedTreatmentLabel={unit.recommendedTreatmentLabel} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * "Also train" / "more" units -- thin by design: what, why, what to do.
 * Mobile: a stacked card. md+: an actual single-line row, title+evidence
 * left, action right at its own width, never stretched to fill the row.
 */
export function DesignCompactTrainingUnit({ unit }: { unit: DesignTrainingUnit }) {
  return (
    <div className="rounded-2xl border border-[var(--dm-border)] bg-[var(--dm-surface)] p-5 md:flex md:items-center md:gap-5">
      <div className="min-w-0 md:flex-1">
        <p className="text-[17px] font-semibold text-[var(--dm-text)]">{unit.skillLabel}</p>
        <div className="mt-2 md:mt-1.5">
          <DesignInstructorEvidence {...unit.evidence} />
        </div>
      </div>
      <div className="mt-4 shrink-0 md:mt-0 md:w-[200px]">
        <DesignVectorAction recommendedTreatmentLabel={unit.recommendedTreatmentLabel} compact />
      </div>
    </div>
  );
}

/**
 * The transfer treatment -- deliberately NOT a "Train with Vector" card.
 * There is no manufactured activity here, so there is no CTA that starts
 * one; the objective itself, framed for the next flight, is the whole
 * action. Visually quieter than the Vector units (no accent hero, no
 * filled button) so it never competes with the units that DO have
 * something to train right now.
 */
export function DesignTransferCard({ unit }: { unit: DesignTransferUnit }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--dm-border)] bg-[var(--dm-surface)] p-5 md:p-6">
      <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--dm-text-soft)]">
        <PlaneTakeoff className="size-3.5 text-[var(--dm-accent)]" aria-hidden />
        Take this into your next flight
      </p>
      <h3 className="mt-1.5 text-[19px] font-semibold text-[var(--dm-text)]">{unit.skillLabel}</h3>
      <div className="mt-3">
        <DesignInstructorEvidence {...unit.evidence} />
      </div>
      <div className="mt-4 rounded-xl bg-[var(--dm-surface-muted)] px-4 py-3">
        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--dm-text-faint)]">Next flight objective</p>
        <p className="mt-1 text-pretty text-[15px] leading-relaxed text-[var(--dm-text)]">{unit.nextFlightObjective}</p>
      </div>
    </div>
  );
}
