"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Radio } from "lucide-react";
import Link from "next/link";
import {
  Card,
  Panel,
  PanelButton,
  PanelHeadline,
  PanelEyebrow,
  PageTitle,
  PrimaryButton,
  Screen,
  Section,
  SecondaryButton,
  SkillMeter,
  StateLabel,
} from "@/components/student/ui";
import { TrainingContextHeader } from "@/components/student/training-context-header";
import { TrainingUnitCard, TrainingUnitCompactRow } from "@/components/student/training-unit-card";
import { cn } from "@/lib/utils";
import type { SkillState } from "@/lib/student/state-tone";
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

/**
 * One card at a time, indexed across everything from this debrief -- no
 * more "Start Here" vs. "Also Train" tiers, no separate hidden overflow
 * list. Every unit past the first is reached the same way: swipe on touch,
 * the arrows/dots below on desktop -- one deck, not a recommendation plus a
 * quieter afterthought section.
 *
 * A single slide renders with no deck chrome at all (no dots, no arrows) --
 * that machinery only earns its place once there's somewhere else to go.
 *
 * Built on CSS scroll-snap rather than a gesture library: on a touch device
 * this already IS a native swipe (the browser's own horizontal scroll
 * physics, not a simulation of one), and the same scroll position drives
 * the desktop arrows/dots -- one source of truth for "which card is active."
 */
function TrainingDeck({ slides }: { slides: ReactNode[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const count = slides.length;

  const scrollToIndex = useCallback((index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || count <= 1) return;
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!el) return;
        const index = Math.round(el.scrollLeft / el.clientWidth);
        setActiveIndex((prev) => (prev === index ? prev : index));
      });
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [count]);

  if (count === 0) return null;
  if (count === 1) return <>{slides[0]}</>;

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" && activeIndex < count - 1) scrollToIndex(activeIndex + 1);
    if (e.key === "ArrowLeft" && activeIndex > 0) scrollToIndex(activeIndex - 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <div
          ref={scrollerRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          role="region"
          aria-label={`Training card ${activeIndex + 1} of ${count}`}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((slide, index) => (
            <div key={index} className="w-full shrink-0 snap-center">
              {slide}
            </div>
          ))}
        </div>

        {/* Prev/next: a desktop affordance. Touch already has real swipe,
            so these stay hidden below md rather than duplicating it. */}
        {activeIndex > 0 ? (
          <button
            type="button"
            aria-label="Previous card"
            onClick={() => scrollToIndex(activeIndex - 1)}
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-hairline bg-surface p-2.5 shadow-md transition-colors hover:bg-surface-sunken md:flex"
          >
            <ChevronLeft className="size-5 text-foreground" aria-hidden />
          </button>
        ) : null}
        {activeIndex < count - 1 ? (
          <button
            type="button"
            aria-label="Next card"
            onClick={() => scrollToIndex(activeIndex + 1)}
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-hairline bg-surface p-2.5 shadow-md transition-colors hover:bg-surface-sunken md:flex"
          >
            <ChevronRight className="size-5 text-foreground" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="flex items-center justify-center gap-1.5" role="tablist" aria-label="Training cards">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={`Go to card ${index + 1} of ${count}`}
            onClick={() => scrollToIndex(index)}
            className={cn("h-2 cursor-pointer rounded-full transition-all", index === activeIndex ? "w-6 bg-brand" : "w-2 bg-hairline")}
          />
        ))}
      </div>
    </div>
  );
}

/** A CFI-assigned Radio Practice scenario, as its own deck slide -- own provenance ("{name} recommends"), own CTA ("Start practice," never "Train with Vector"), since there's no Vector diagnosis step to run here; the instructor already decided. */
function CfiRadioAssignmentCard({ instructorFirstName, scenarioTitle, href }: { instructorFirstName: string; scenarioTitle: string; href: string }) {
  return (
    <Panel>
      <PanelEyebrow icon={<Radio className="size-3.5" aria-hidden />}>{instructorFirstName} recommends</PanelEyebrow>
      <PanelHeadline>{scenarioTitle}</PanelHeadline>
      <div className="mt-5">
        <PanelButton href={href}>Start practice</PanelButton>
      </div>
    </Panel>
  );
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

  // Vector is introduced INSIDE the recommendation it is making, and the
  // card's own action row is built here rather than in TrainingUnitCard --
  // the card is purely presentational, so it never decides between a real
  // vectorSession link and the prototype's local-state menu buttons.
  const startHereActions = vectorSession ? (
    <PanelButton href={vectorSession.href}>{vectorSession.buttonLabel}</PanelButton>
  ) : primaryAction || (secondaryActions && secondaryActions.length > 0) ? (
    <>
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
    </>
  ) : null;

  // The recommended unit is always slide 0. Every other current-debrief
  // unit -- previously split into "also train" (visible) and "more train"
  // (behind a disclosure) -- is now just more slides in the same deck, in
  // the same order, nothing held back. A CFI-assigned Radio Practice
  // scenario, when there is one, sits right after Start Here -- a direct
  // instructor assignment is a strong enough signal to surface early,
  // without overriding Vector's own top pick.
  const otherUnits = [...(alsoTrain ?? []), ...(moreTrain ?? [])];
  const slides: ReactNode[] = [
    <TrainingUnitCard
      key="recommended"
      tone={recommended.tone}
      eyebrow={recommended.startHereEyebrow ?? recommended.toneLabel}
      skillLabel={recommended.skillLabel}
      acsArea={recommended.acsArea}
      comparisonLine={recommended.comparisonLine}
      evidence={recommended.evidence}
      vectorInfo={vectorInfo}
      actions={startHereActions}
    />,
  ];
  if (radioPractice?.cfiRecommendation) {
    slides.push(
      <CfiRadioAssignmentCard
        key="radio-assignment"
        instructorFirstName={radioPractice.cfiRecommendation.instructorFirstName}
        scenarioTitle={radioPractice.cfiRecommendation.scenarioTitle}
        href={radioPractice.cfiRecommendation.href}
      />,
    );
  }
  for (const unit of otherUnits) {
    slides.push(
      <TrainingUnitCompactRow
        key={unit.vectorSession.href}
        skillLabel={unit.skillLabel}
        evidence={unit.evidence}
        action={<PrimaryButton href={unit.vectorSession.href}>{unit.vectorSession.buttonLabel}</PrimaryButton>}
      />,
    );
  }

  return (
    <Screen>
      <PageTitle>Train</PageTitle>
      <TrainingContextHeader>{recommended.contextLine}</TrainingContextHeader>

      <Section title={sectionTitle} flush>
        <TrainingDeck slides={slides} />
      </Section>

      {/* The generic Radio Practice entry point -- only when there's no CFI
          assignment already covering it (that case is a deck slide above)
          and Vector's own top pick isn't already pointing here (contextNote
          set) -- never a second, redundant standalone entry. */}
      {radioPractice && !radioPractice.cfiRecommendation && !radioPractice.contextNote ? (
        <Section title="Radio Practice">
          <Card>
            <p className="flex items-center gap-1.5 text-[17px] font-medium text-foreground">
              <Radio className="size-4 text-foreground-faint" aria-hidden />
              Radio Practice
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-foreground-soft">
              Practice realistic ATC scenarios and get feedback on your responses.
            </p>
            <div className="mt-4">
              <PrimaryButton href={radioPractice.startHref}>Start practice</PrimaryButton>
            </div>
          </Card>
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
