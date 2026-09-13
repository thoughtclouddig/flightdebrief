import type { ComponentType } from "react";
import { Compass, Gauge, PlaneTakeoff, Radio, Sparkles, Wind } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DesignRadioAssignment, DesignTrainingUnit, DesignTransferUnit } from "@/lib/design/train-fixtures";

/** Binds the last three words together with non-breaking spaces so a long line can never strand one or two orphaned words on their own last line. */
function noOrphan(text: string) {
  const words = text.split(" ");
  if (words.length < 4) return text;
  return [...words.slice(0, -3), words.slice(-3).join(" ")].join(" ");
}

/** Keyed purely by fixture id -- a real build would key this off skill/category, but nothing here reads from a real image library. Restrained: an icon on a gradient plate, never a stock photo standing in for evidence. */
const HERO_ICON: Record<string, ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>> = {
  "crosswind-landing": Wind,
  "tower-communications": Radio,
  "slow-flight-knowledge": Gauge,
  "steep-turns-transfer": Compass,
  "short-field-landing": Wind,
  "airspace-knowledge": Compass,
  "radio-assignment-initial-atis": Radio,
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
      <p className="relative max-w-[30ch] text-pretty text-[17px] italic leading-relaxed text-[var(--dm-text)] xl:text-[19px]">{noOrphan(quote)}</p>
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
 * The rich per-card treatment every unit in DesignTrainDeck gets -- not just
 * a "Start here" special case anymore. Only the card Vector actually ranked
 * first carries the "Start here" eyebrow (the deck passes it in); every
 * other card is reached by swiping/paging to it and needs no special label
 * of its own -- its position in the deck already says what it is.
 *
 * Mobile: hero visual, skill title, evidence, ACS status line, full-width
 * CTA -- one column, in that exact order.
 * Tablet (md-xl): the same column, but the action becomes its own bordered
 * panel rather than a button floating at the card's bottom edge.
 * Large desktop (xl+): a genuine three-part horizontal composition --
 * visual, skill/evidence, action panel -- since only one card is ever
 * visible at a time and it can afford real width.
 */
export function DesignTrainingUnitCard({ unit, eyebrow }: { unit: DesignTrainingUnit; eyebrow?: string }) {
  return (
    <div className="rounded-[28px] border border-[var(--dm-border)] bg-[var(--dm-surface-elevated)] p-6 shadow-[var(--dm-shadow)] md:p-8 xl:p-10">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-stretch xl:gap-8">
        <DesignHeroVisual unitId={unit.id} className="h-36 w-full shrink-0 md:h-44 xl:h-auto xl:w-[220px]" />

        <div className="flex min-w-0 flex-1 flex-col gap-5 xl:flex-row xl:gap-8">
          <div className="min-w-0 xl:max-w-[42ch] xl:flex-1">
            {eyebrow ? <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--dm-accent)]">{eyebrow}</p> : null}
            <h2 className={cn("text-[26px] font-semibold leading-[1.1] tracking-[-0.01em] text-[var(--dm-text)] xl:text-[30px]", eyebrow && "mt-1.5")}>
              {unit.skillLabel}
            </h2>
            <p className="mt-1.5 max-w-[30ch] text-pretty text-[13px] text-[var(--dm-text-faint)]">
              <span className="font-semibold uppercase tracking-[0.06em]">FAA ACS</span>
              <span className="px-1.5 opacity-60">·</span>
              {noOrphan(unit.acsArea)}
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
 * A CFI-assigned Radio Practice scenario -- deliberately NOT a Vector card.
 * An instructor picked this specific scenario for this specific student,
 * independent of anything the debrief itself surfaced, so it carries its
 * own provenance ("{name} assigned this," never "Vector recommends") and
 * its own CTA ("Start practice," never "Train with Vector") -- there is no
 * diagnosis step to run here at all; the instructor already decided.
 */
export function DesignAssignedPracticeCard({ assignment }: { assignment: DesignRadioAssignment }) {
  return (
    <div className="rounded-[28px] border border-[var(--dm-border)] bg-[var(--dm-surface-elevated)] p-6 shadow-[var(--dm-shadow)] md:p-8 xl:p-10">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-stretch xl:gap-8">
        <DesignHeroVisual unitId={assignment.id} className="h-36 w-full shrink-0 md:h-44 xl:h-auto xl:w-[220px]" />

        <div className="flex min-w-0 flex-1 flex-col gap-5 xl:flex-row xl:gap-8">
          <div className="min-w-0 xl:max-w-[42ch] xl:flex-1">
            <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--dm-accent)]">
              {assignment.instructorFirstName} assigned this
            </p>
            <h2 className="mt-1.5 text-[26px] font-semibold leading-[1.1] tracking-[-0.01em] text-[var(--dm-text)] xl:text-[30px]">
              {assignment.scenarioTitle}
            </h2>
            <p className="mt-3 max-w-[38ch] text-pretty text-[15px] leading-relaxed text-[var(--dm-text-soft)]">
              {noOrphan(assignment.scenarioContext)}
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--dm-surface-muted)] p-5 md:border md:border-[var(--dm-border)] xl:w-[260px] xl:shrink-0 xl:self-start">
            <button
              type="button"
              className="flex min-h-[52px] w-full cursor-pointer items-center justify-center rounded-2xl bg-[var(--dm-accent)] px-5 text-[17px] font-semibold text-[var(--dm-on-accent)] transition-opacity hover:opacity-90"
            >
              Start practice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The transfer treatment -- deliberately NOT a "Train with Vector" card.
 * There is no manufactured activity here, so there is no CTA that starts
 * one; the objective itself, framed for the next flight, is the whole
 * action. Visually quieter than the Vector units (dashed border, no hero,
 * no filled button) so it never competes with the cards that DO have
 * something to train right now, but sized to match them -- it's a real
 * card in the same deck, not an aside.
 */
export function DesignTransferCard({ unit }: { unit: DesignTransferUnit }) {
  return (
    <div className="rounded-[28px] border border-dashed border-[var(--dm-border)] bg-[var(--dm-surface)] p-6 md:p-8 xl:p-10">
      <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--dm-text-soft)]">
        <PlaneTakeoff className="size-3.5 text-[var(--dm-accent)]" aria-hidden />
        Take this into your next flight
      </p>
      <h3 className="mt-1.5 text-[26px] font-semibold leading-[1.1] tracking-[-0.01em] text-[var(--dm-text)] xl:text-[30px]">{unit.skillLabel}</h3>
      <div className="mt-4 max-w-[52ch]">
        <DesignInstructorEvidence {...unit.evidence} />
      </div>
      <div className="mt-4 max-w-[52ch] rounded-xl bg-[var(--dm-surface-muted)] px-4 py-3">
        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--dm-text-faint)]">Next flight objective</p>
        <p className="mt-1 text-pretty text-[15px] leading-relaxed text-[var(--dm-text)]">{noOrphan(unit.nextFlightObjective)}</p>
      </div>
    </div>
  );
}
