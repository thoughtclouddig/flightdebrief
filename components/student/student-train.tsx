"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight, Radio } from "lucide-react";
import Link from "next/link";
import {
  AcsBadge,
  Card,
  Evidence,
  InfoTip,
  Panel,
  PanelButton,
  PanelEyebrow,
  PanelHeadline,
  PageTitle,
  PrimaryButton,
  Screen,
  Section,
  SecondaryButton,
  SkillMeter,
  StateLabel,
  VectorMark,
} from "@/components/student/ui";
import { stateTone, type SkillState } from "@/lib/student/state-tone";
import type { VectorSession } from "@/lib/student/vector-coaching";

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
 *
 * Production omits secondaryActions (Review/Quiz/Ask) entirely rather than
 * showing them as a disabled row -- DEV QA product decision: a control that
 * will never become enabled reads as broken, not "coming soon." The known
 * gap is tracked elsewhere, not surfaced as dead UI here.
 */
export interface StudentTrainRecommended {
  tone: SkillState;
  /** Eyebrow text -- the prototype uses the literal skill state word; production's recommendation can come from a cross-flight theme, which isn't one graded skill, so it uses different honest wording. */
  toneLabel: string;
  /** When set, replaces toneLabel as the eyebrow -- production's "Start here" label for the top current-debrief training unit. Vector picking one unit among several is real ranking; naming it "Top Priority" or similar reads as an algorithm's verdict. "Start here" reads as a trainer's suggestion. */
  startHereEyebrow?: string;
  skillLabel: string;
  acsArea: { name: string; code?: string } | null;
  contextLine: string;
  /** "You called this X. {instructor} called it Y." -- only meaningful when a real contested-objective comparison exists. Prototype-only for now; production has no wiring for this comparison yet. */
  comparisonLine?: ReactNode | null;
  evidence: { label: string; text: string };
}

/**
 * One of the current debrief's other training units -- deliberately thin:
 * WHAT (skillLabel), WHY (one evidence line), WHAT DO I DO (one button).
 * The training experience itself never lives in the card; it happens after
 * opening the unit at vectorSession.href.
 */
export interface StudentTrainCompactUnit {
  skillLabel: string;
  evidence: { label: string; text: string };
  vectorSession: VectorSession;
}

export interface StudentTrainAction {
  label: string;
  href?: string;
  onClick?: () => void;
  caption?: ReactNode;
  /** Known gap, not a dead end -- renders as a visibly non-interactive marker instead of a link. Never pair with href/onClick. */
  disabled?: boolean;
}

export interface StudentTrainSkillRow {
  key: string;
  label: string;
  state: SkillState;
  score: number;
  max: number;
  href: string;
}

export interface StudentTrainRadioPractice {
  /** Always available -- into the scenario picker, never gated on a CFI. */
  startHref: string;
  /** Set only when a CFI has an assignment still pending (not yet completed) -- stronger provenance/priority framing, same underlying engine as the generic entry point. */
  cfiRecommendation: { instructorFirstName: string; scenarioTitle: string; href: string } | null;
  /** One line of context when the same recommendation Train's top panel is already showing points at radio communications -- never a second recommendation system, just a pointer at the one real entry point that can act on it. */
  contextNote: string | null;
}

export interface StudentTrainProps {
  recommended: StudentTrainRecommended | null;
  emptyMessage?: string;
  vectorInfo: { tipLabel: string; tipContent: ReactNode };
  /**
   * Production's one true action -- always a real link into
   * /train/vector/[skill] (see lib/student/vector-coaching.ts), never both
   * this and primaryAction/secondaryActions. When present, this entirely
   * replaces the primaryAction/secondaryActions rendering below with a
   * single "Train with Vector" control.
   */
  vectorSession?: VectorSession | null;
  /** Prototype-only menu actions (Chair Flying / 5-minute review, Review/Quiz/Ask) -- rendered only when vectorSession is absent. Production always passes vectorSession instead. */
  primaryAction?: StudentTrainAction | null;
  /** Review/Quiz/Ask -- prototype-only, omitted in production. */
  secondaryActions?: StudentTrainAction[];
  /** Student-initiated Radio Practice -- null hides the section entirely (today: only the /v2 real-data branch, which has no /v2/practice/[id] counterpart yet). */
  radioPractice?: StudentTrainRadioPractice | null;
  /** Production's real content (Recommended Study, Vector guidance) occupies the position primaryAction/secondaryActions would have -- passed in rather than hidden elsewhere. */
  afterHeader?: ReactNode;
  /** Prototype/fixture-only "Still working on" list. Omitted entirely in production -- Vector's one recommendation is the whole point; a full skill inventory undercuts it. */
  stillWorkingOn?: StudentTrainSkillRow[];
  /** Defaults to "Today Vector recommends" (the fixtures' own heading, unchanged) -- production overrides it to "From your last debrief" once alsoTrain/moreTrain are in play. */
  sectionTitle?: string;
  /** Other current-debrief training units, immediately visible -- production only, up to 2. */
  alsoTrain?: StudentTrainCompactUnit[];
  /** Current-debrief units beyond the immediately-visible set -- never silently dropped, revealed via progressive disclosure. */
  moreTrain?: StudentTrainCompactUnit[];
}

export function StudentTrain({
  recommended,
  emptyMessage,
  vectorInfo,
  vectorSession,
  primaryAction,
  secondaryActions,
  radioPractice,
  afterHeader,
  stillWorkingOn,
  sectionTitle = "Today Vector recommends",
  alsoTrain,
  moreTrain,
}: StudentTrainProps) {
  const [moreRevealed, setMoreRevealed] = useState(false);
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

      <Section title={sectionTitle} flush>
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

          {recommended.contextLine ? (
            <p className="mt-5 text-[15px] leading-relaxed text-panel-foreground-soft">{recommended.contextLine}</p>
          ) : null}

          <div className="mt-6">
            <PanelEyebrow className={stateTone(recommended.tone, true).text}>
              {recommended.startHereEyebrow ?? recommended.toneLabel}
            </PanelEyebrow>
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

          {vectorSession ? (
            <div className="mt-6 flex flex-col gap-2.5">
              <PanelButton href={vectorSession.href}>{vectorSession.buttonLabel}</PanelButton>
            </div>
          ) : primaryAction || (secondaryActions && secondaryActions.length > 0) ? (
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
                    <SecondaryButton key={a.label} href={a.href} onClick={a.onClick} onPanel disabled={a.disabled}>
                      {a.label}
                    </SecondaryButton>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </Panel>
      </Section>

      {alsoTrain && alsoTrain.length > 0 ? (
        <Section title="Also train">
          <div className="flex flex-col gap-3">
            {alsoTrain.map((unit) => (
              <CompactTrainCard key={unit.vectorSession.href} unit={unit} />
            ))}
          </div>
        </Section>
      ) : null}

      {moreTrain && moreTrain.length > 0 ? (
        moreRevealed ? (
          <div className="flex flex-col gap-3 px-1.5">
            {moreTrain.map((unit) => (
              <CompactTrainCard key={unit.vectorSession.href} unit={unit} />
            ))}
          </div>
        ) : (
          <button
            onClick={() => setMoreRevealed(true)}
            className="flex items-center gap-1 self-start px-1.5 text-[15px] font-medium text-brand"
          >
            {moreTrain.length} more from this debrief
            <ChevronRight className="size-4" aria-hidden />
          </button>
        )
      ) : null}

      {radioPractice && !(radioPractice.cfiRecommendation === null && radioPractice.contextNote !== null) ? (
        <Section title="Other training">
          <div className="flex flex-col gap-3">
            {radioPractice.cfiRecommendation ? (
              <Panel>
                <PanelEyebrow icon={<Radio className="size-3.5" aria-hidden />}>
                  {radioPractice.cfiRecommendation.instructorFirstName} recommends
                </PanelEyebrow>
                <PanelHeadline>{radioPractice.cfiRecommendation.scenarioTitle}</PanelHeadline>
                <div className="mt-5">
                  <PanelButton href={radioPractice.cfiRecommendation.href}>Start practice</PanelButton>
                </div>
              </Panel>
            ) : null}
            {/* contextNote is only ever set when Vector's own top panel is
                already routing to this exact same startHref (see
                lib/student/train-production-adapter.tsx's buildRadioPracticeProps)
                -- a second, generic "Start practice" card here would be a
                redundant standalone entry, not a second option. */}
            {radioPractice.contextNote !== null ? null : (
              <Card>
                <p className="flex items-center gap-1.5 text-[17px] font-medium text-foreground">
                  <Radio className="size-4 text-foreground-faint" aria-hidden />
                  Radio Practice
                </p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-foreground-soft">
                  {radioPractice.contextNote ?? "Practice realistic ATC scenarios and get feedback on your responses."}
                </p>
                <div className="mt-4">
                  <PrimaryButton href={radioPractice.startHref}>Start practice</PrimaryButton>
                </div>
              </Card>
            )}
          </div>
        </Section>
      ) : null}

      {afterHeader}

      {stillWorkingOn && stillWorkingOn.length > 0 ? (
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

/** WHAT / WHY / WHAT DO I DO, nothing more -- the training experience itself lives at vectorSession.href, never inside the card. */
function CompactTrainCard({ unit }: { unit: StudentTrainCompactUnit }) {
  return (
    <Card>
      <p className="text-[17px] font-medium text-foreground">{unit.skillLabel}</p>
      <div className="mt-2">
        <Evidence label={unit.evidence.label} tone="instructor" text={unit.evidence.text} />
      </div>
      <div className="mt-4">
        <PrimaryButton href={unit.vectorSession.href}>{unit.vectorSession.buttonLabel}</PrimaryButton>
      </div>
    </Card>
  );
}
