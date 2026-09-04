"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  AcsBadge,
  Evidence,
  InfoTip,
  Panel,
  PanelButton,
  PanelEyebrow,
  PanelHeadline,
  PageTitle,
  Screen,
  Section,
  SecondaryButton,
  SkillMeter,
  StateLabel,
  VectorMark,
} from "@/components/student/ui";
import { stateTone, type SkillState } from "@/lib/student/state-tone";

/**
 * Train's "what should I practice right now" content, shared between
 * app/prototype/vector/train/page.tsx (fixture props) and
 * app/(product)/train/page.tsx (database-derived props).
 *
 * The prototype's mode-switching (Review/Quiz/Ask, a full-screen replace
 * driven by local client state) stays local to that route file, not here --
 * none of the three modes have a production equivalent (Quiz reads
 * CONCEPTS/KNOWLEDGE_CHECK, entirely authored prose with no production
 * library; Ask opens a live chat against an unauthenticated prototype-only
 * endpoint; Review is the same authored-prose problem as Quiz), so there is
 * nothing for a production caller to genuinely share for that part. This
 * component is only ever the "menu" state.
 */
export interface StudentTrainRecommended {
  tone: SkillState;
  /** Eyebrow text -- the prototype uses the literal skill state word; production's recommendation can come from a cross-flight theme, which isn't one graded skill, so it uses different honest wording. */
  toneLabel: string;
  skillLabel: string;
  acsArea: { name: string; code?: string } | null;
  contextLine: string;
  /** "You called this X. {instructor} called it Y." -- only meaningful when a real contested-objective comparison exists. Prototype-only for now; production has no wiring for this comparison yet. */
  comparisonLine?: ReactNode | null;
  evidence: { label: string; text: string };
}

export interface StudentTrainAction {
  label: string;
  href?: string;
  onClick?: () => void;
  caption?: ReactNode;
}

export interface StudentTrainSkillRow {
  key: string;
  label: string;
  state: SkillState;
  score: number;
  max: number;
  href: string;
}

export interface StudentTrainProps {
  recommended: StudentTrainRecommended | null;
  emptyMessage?: string;
  vectorInfo: { tipLabel: string; tipContent: ReactNode };
  /** Chair Flying (prototype, when a real drill matched) or the 5-minute-review fallback -- omitted entirely in production, where neither has real backing. */
  primaryAction?: StudentTrainAction | null;
  /** Review/Quiz/Ask -- prototype-only, omitted in production. */
  secondaryActions?: StudentTrainAction[];
  /** Production's real content (Recommended Study, Vector guidance) occupies the position primaryAction/secondaryActions would have -- passed in rather than hidden elsewhere. */
  afterHeader?: ReactNode;
  stillWorkingOn: StudentTrainSkillRow[];
}

export function StudentTrain({ recommended, emptyMessage, vectorInfo, primaryAction, secondaryActions, afterHeader, stillWorkingOn }: StudentTrainProps) {
  if (!recommended) {
    return (
      <Screen>
        <PageTitle>Train</PageTitle>
        <p className="px-1.5 text-[15px] text-foreground-faint">
          {emptyMessage ?? "Nothing to train on yet -- this fills in once your first debrief is finished."}
        </p>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageTitle>Train</PageTitle>

      <Section title="Today Vector recommends" flush>
        <Panel>
          {/* Vector is introduced INSIDE the recommendation it is making.
              Standing alone above the card it had nothing to align to and
              read as a page header; here it reads as the byline on a specific
              piece of advice, which is what it actually is. */}
          <div className="flex items-start justify-between gap-2 border-b border-panel-hairline pb-5">
            <VectorMark subtitle="Your AI flight trainer" onPanel />
            <InfoTip label={vectorInfo.tipLabel} onPanel>
              {vectorInfo.tipContent}
            </InfoTip>
          </div>

          <p className="mt-5 text-[15px] leading-relaxed text-panel-foreground-soft">{recommended.contextLine}</p>

          <div className="mt-6">
            <PanelEyebrow className={stateTone(recommended.tone, true).text}>{recommended.toneLabel}</PanelEyebrow>
          </div>
          <PanelHeadline>{recommended.skillLabel}</PanelHeadline>
          {recommended.acsArea ? (
            <div className="mt-2">
              <AcsBadge area={recommended.acsArea.name} code={recommended.acsArea.code} onPanel />
            </div>
          ) : null}

          {/* Why THIS one. The two ratings side by side is the whole
              argument for spending time on a skill the student thinks is
              already fine, so it goes above the evidence rather than being
              left to infer from it. */}
          {recommended.comparisonLine ? (
            <p className="mt-4 text-[15px] leading-relaxed text-panel-foreground-soft">{recommended.comparisonLine}</p>
          ) : null}

          {/* The reason, in the instructor's own words. A recommendation
              without its evidence is just a suggestion. */}
          <div className="mt-5">
            <Evidence label={recommended.evidence.label} tone="instructor" text={recommended.evidence.text} onPanel />
          </div>

          {primaryAction || (secondaryActions && secondaryActions.length > 0) ? (
            <div className="mt-6 flex flex-col gap-2.5">
              {primaryAction ? (
                <>
                  <PanelButton href={primaryAction.href} onClick={primaryAction.onClick}>
                    {primaryAction.label}
                  </PanelButton>
                  {primaryAction.caption ? <p className="px-1 text-[14px] text-panel-foreground-soft">{primaryAction.caption}</p> : null}
                </>
              ) : null}
              {secondaryActions && secondaryActions.length > 0 ? (
                <div className="mt-1.5 flex gap-2.5">
                  {secondaryActions.map((a) => (
                    <SecondaryButton key={a.label} href={a.href} onClick={a.onClick} onPanel>
                      {a.label}
                    </SecondaryButton>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </Panel>
      </Section>

      {afterHeader}

      {stillWorkingOn.length > 0 ? (
        <Section title="Still working on">
          <div className="flex flex-col">
            {stillWorkingOn.map((s) => (
              <Link key={s.key} href={s.href} className="flex min-h-[68px] items-center gap-4 border-b border-hairline py-4 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-medium text-foreground">{s.label}</p>
                  <StateLabel state={s.state} />
                </div>
                <SkillMeter score={s.score} max={s.max} state={s.state} />
                <ChevronRight className="size-4 shrink-0 text-foreground-faint" aria-hidden />
              </Link>
            ))}
          </div>
        </Section>
      ) : null}
    </Screen>
  );
}
