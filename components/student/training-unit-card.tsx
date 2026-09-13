import type { ReactNode } from "react";
import { Clock, PlaneTakeoff } from "lucide-react";
import { cn } from "@/lib/utils";
import { AcsBadge, Evidence, InfoTip, Panel, PanelEyebrow, PanelHeadline, VectorMark, stateTone } from "@/components/student/ui";
import type { SkillState } from "@/lib/student/state-tone";

/**
 * Train's one rich unit card -- used for every slide in the deck, not just
 * the recommended one. Every unit is a real Vector-ranked recommendation,
 * so every unit earns the same visual weight; only the eyebrow text differs
 * ("Start here" for the top pick, the unit's own toneLabel for the rest --
 * its position in the deck already says it isn't the top pick).
 *
 * Composition changes with width rather than just stretching:
 *
 * - Mobile: one vertical column (Vector byline, eyebrow, headline, evidence,
 *   actions).
 * - Tablet (md+): the same column, but text keeps a real reading measure
 *   instead of running the full width of a now-wider panel, and the action
 *   row stops being a stretched full-width button.
 * - Large desktop (xl+): a genuine two-column split -- the claim and its
 *   evidence on the left, the optional image and the action on the right.
 *
 * imageUrl/timeHint/nextFlightConnection are all optional and unrendered
 * when absent -- this card has to look complete without any of them, since
 * today's adapter supplies none of the three.
 */
export interface TrainingUnitCardProps {
  tone: SkillState;
  eyebrow: string;
  skillLabel: string;
  acsArea: { name: string; code?: string } | null;
  /** "You called this X. {instructor} called it Y." -- only rendered when a real contested-objective comparison exists. */
  comparisonLine?: ReactNode | null;
  evidence: { label: string; text: string };
  imageUrl?: string | null;
  /** A short effort hint, e.g. "~5 min" -- never a promise the engine can't keep, so this stays a plain string the caller controls. */
  timeHint?: string | null;
  /** "This connects to your next flight's short-field landings." -- how this unit ties back into the airplane, when that connection is known. */
  nextFlightConnection?: string | null;
  vectorInfo: { tipLabel: string; tipContent: ReactNode };
  /** The card's own action row -- built by the caller (Train with Vector, or the prototype's menu buttons), never decided in here. */
  actions: ReactNode;
}

export function TrainingUnitCard({
  tone,
  eyebrow,
  skillLabel,
  acsArea,
  comparisonLine,
  evidence,
  imageUrl,
  timeHint,
  nextFlightConnection,
  vectorInfo,
  actions,
}: TrainingUnitCardProps) {
  return (
    <Panel className="xl:p-7">
      <div className="flex items-start justify-between gap-2 border-b border-panel-hairline pb-5">
        <VectorMark subtitle="Your AI flight trainer" onPanel />
        <InfoTip label={vectorInfo.tipLabel} onPanel>
          {vectorInfo.tipContent}
        </InfoTip>
      </div>

      <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between xl:gap-10">
        <div className="min-w-0 xl:max-w-[46ch] xl:flex-1">
          <PanelEyebrow className={stateTone(tone, true).text}>{eyebrow}</PanelEyebrow>
          <PanelHeadline>{skillLabel}</PanelHeadline>
          {acsArea ? (
            <div className="mt-2">
              <AcsBadge area={acsArea.name} code={acsArea.code} onPanel />
            </div>
          ) : null}

          {/* Why THIS one. The two ratings side by side is the whole
              argument for spending time on a skill the student thinks is
              already fine, so it goes above the evidence rather than being
              left to infer from it. */}
          {comparisonLine ? <p className="mt-4 text-pretty text-[15px] leading-relaxed text-panel-foreground-soft">{comparisonLine}</p> : null}

          {/* The reason, in the instructor's own words. A recommendation
              without its evidence is just a suggestion. */}
          <div className="mt-5">
            <Evidence label={evidence.label} tone="instructor" text={evidence.text} onPanel />
          </div>

          {nextFlightConnection ? (
            <p className="mt-4 flex items-start gap-2 text-[14px] leading-relaxed text-panel-foreground-soft">
              <PlaneTakeoff className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden />
              <span className="text-pretty">{nextFlightConnection}</span>
            </p>
          ) : null}
        </div>

        {imageUrl ? (
          <div className="overflow-hidden rounded-2xl xl:order-first xl:w-[280px] xl:shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- an arbitrary, caller-supplied URL; next/image requires a known remote domain, and this card has to work with no image at all anyway. */}
            <img src={imageUrl} alt="" className="aspect-[16/10] w-full object-cover xl:aspect-[4/3]" loading="lazy" />
          </div>
        ) : null}

        <div className={cn("flex flex-col gap-2.5 md:self-start", imageUrl ? "xl:w-[280px] xl:shrink-0" : "xl:w-[260px] xl:shrink-0")}>
          {actions}
          {timeHint ? (
            <p className="flex items-center justify-center gap-1.5 text-[13px] text-panel-foreground-soft xl:justify-start">
              <Clock className="size-3.5" aria-hidden />
              {timeHint}
            </p>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

