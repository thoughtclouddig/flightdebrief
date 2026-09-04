import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import {
  AcsBadge,
  BackLink,
  Evidence,
  InfoTip,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Section,
  SkillMeter,
  StateLabel,
  TrendStrip,
} from "@/components/student/ui";
import { ObjectiveComparison } from "@/components/student/debrief/assessment-comparison";
import type { SkillState } from "@/lib/student/state-tone";
import type { PerformanceLevelCode } from "@/lib/performance-levels";

/**
 * One skill, in full -- where progressive disclosure lands. Shared between
 * the fixture demo (app/prototype/vector/progress/[skill]) and the real
 * drill-down (app/(product)/progress/[skill]); these used to be two
 * independently-written pages that happened to end up looking similar.
 *
 * "How you both saw it" and "Vector's read" are optional because they're
 * genuine capability gaps in production, not stylistic choices: production
 * computes a perception gap per FLIGHT (lib/perception-gap.ts), not
 * aggregated per skill across flights, and there is no real per-student
 * Vector context builder yet. Passing null omits the section rather than
 * faking one -- same pattern as Debrief Detail's Flight Moments.
 */
export function SkillDetailScreen({
  backHref,
  label,
  score,
  max,
  state,
  infoTipText,
  acsArea,
  comparison,
  latestEvidence,
  recurring,
  trendPoints,
  vectorRead,
  trainHref,
  lessonHistoryHref,
}: {
  backHref: string;
  label: string;
  score: number;
  max: number;
  state: SkillState;
  infoTipText: ReactNode;
  acsArea: string | null;
  comparison: { task: string; student: PerformanceLevelCode; instructor: PerformanceLevelCode; instructorName: string } | null;
  latestEvidence: { label: string; text: string } | null;
  recurring: { lessons: number; instructors: number } | null;
  trendPoints: { label: string; score: number; max: number; state: SkillState }[];
  vectorRead: string | null;
  trainHref: string;
  lessonHistoryHref: string;
}) {
  return (
    <Screen>
      <BackLink href={backHref}>Progress</BackLink>

      <div>
        <h1 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">{label}</h1>
        <div className="mt-4 flex items-center gap-3">
          <SkillMeter score={score} max={max} state={state} size="lg" />
          <StateLabel state={state} />
          <InfoTip label="What this means" align="left">
            {infoTipText}
          </InfoTip>
        </div>
        {acsArea ? (
          <div className="mt-3">
            <AcsBadge area={acsArea} />
          </div>
        ) : null}
      </div>

      {comparison ? (
        <Section title="How you both saw it" flush>
          <ObjectiveComparison
            task={comparison.task}
            student={comparison.student}
            instructor={comparison.instructor}
            instructorName={comparison.instructorName}
          />
        </Section>
      ) : null}

      {latestEvidence ? (
        <Section title="Latest evidence">
          <div className="flex flex-col gap-6">
            <Evidence label={latestEvidence.label} tone="instructor" text={latestEvidence.text} />
          </div>
        </Section>
      ) : null}

      {recurring ? (
        <Section title="Still showing up">
          <p className="text-[17px] leading-snug text-foreground">
            {recurring.lessons} recent lessons · {recurring.instructors} instructors
          </p>
        </Section>
      ) : null}

      {trendPoints.length > 0 ? (
        <Section title="Trend">
          <TrendStrip points={trendPoints} />
        </Section>
      ) : null}

      {vectorRead ? (
        <Section title="Vector's read">
          <Evidence label="Vector" tone="vector" quoted={false} text={vectorRead} />
        </Section>
      ) : null}

      <div className="flex flex-col gap-2.5">
        <PrimaryButton href={trainHref}>
          Train this with Vector
          <ArrowRight className="size-[18px]" aria-hidden />
        </PrimaryButton>
        <SecondaryButton href={lessonHistoryHref}>View lesson history</SecondaryButton>
      </div>
    </Screen>
  );
}
