"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { VectorPanel } from "@/components/prototype/vector-panel";
import { KnowledgeCheck } from "@/components/prototype/knowledge-check";
import {
  AcsBadge,
  BackLink,
  Card,
  Evidence,
  PageTitle,
  Panel,
  PanelButton,
  PanelEyebrow,
  PanelHeadline,
  InfoTip,
  SkillMeter,
  Screen,
  Section,
  SecondaryButton,
  StateLabel,
  stateTone,
  VectorMark,
} from "@/components/prototype/ui";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CONCEPTS, INSTRUCTOR, LAST_FLIGHT, NEXT_LESSON, SKILL_SCORES, SUGGESTED } from "@/lib/prototype/vector-data";
import { recommendedDrill } from "@/lib/prototype/chair-fly";

const CHAIR_FLY_HREF = "/prototype/vector/train/chair-fly";

type Mode = "menu" | "review" | "quiz" | "ask";

/**
 * Train answers: what should I practice right now?
 *
 * Vector RECOMMENDS one thing rather than presenting a menu. Four equal
 * buttons is a tool tray, and a tool tray puts the decision back on a
 * student who opened the app precisely because they did not know what to
 * work on. The recommendation is the objective the two of them saw
 * differently when there is one, otherwise the lowest-scoring open skill --
 * with the instructor's own words as the reason either way.
 */
export default function TrainPage() {
  const [mode, setMode] = useState<Mode>("menu");
  const crosswind = CONCEPTS["crosswind-correction-through-touchdown"]!;
  const open = SKILL_SCORES.filter((s) => s.state !== "Meets Standard");
  const weakest = [...open].sort((a, b) => a.score / a.max - b.score / b.max)[0]!;

  /*
   * What Vector recommends, and the order matters.
   *
   * A contested objective outranks the weakest open skill. The weakest skill
   * is the one the student already knows is a problem -- Jake said so, it is
   * on the debrief, and she would pick it herself. The contested one is the
   * one she thinks went fine, which is exactly why nobody would choose to
   * rehearse it. That is the recommendation only this product can make,
   * because it is the only one holding both assessments.
   *
   * Falls back to the weakest open skill when the last flight produced no
   * disagreement, so Train always has something to say.
   */
  const drill = recommendedDrill();
  const recommended = (drill ? open.find((s) => s.skill === drill.skill) : undefined) ?? weakest;

  if (mode !== "menu") {
    return (
      <Screen>
        <BackLink onClick={() => setMode("menu")}>Training</BackLink>
        {mode === "quiz" ? <KnowledgeCheck /> : null}
        {mode === "ask" ? (
          <VectorPanel
            context={`${LAST_FLIGHT.lesson} · ${INSTRUCTOR.firstName} · ${LAST_FLIGHT.date}`}
            suggestions={SUGGESTED.nextFlight}
            onAction={(t) => setMode(t === "quiz" ? "quiz" : "menu")}
          />
        ) : null}
        {mode === "review" ? (
          <Card>
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">Quick review</p>
            <h2 className="mt-1.5 text-[22px] font-semibold leading-tight tracking-tight text-foreground">
              {crosswind.title}
            </h2>
            <div className="mt-4">
              <Evidence label={INSTRUCTOR.firstName} tone="instructor" text={crosswind.instructorMeant} />
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-foreground-soft">{crosswind.whyItHappens}</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {crosswind.nextTime.map((n) => (
                <li key={n} className="flex items-start gap-3 text-[15px] leading-snug text-foreground">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                  {n}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] text-foreground-faint">{crosswind.sources[0]}</p>
            <div className="mt-5">
              <SecondaryButton onClick={() => setMode("quiz")}>Check my understanding</SecondaryButton>
            </div>
          </Card>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen>
      <PageTitle>Train</PageTitle>

      <Section title={<>Today Vector recommends</>} flush>
        <Panel>
          {/* Vector is introduced INSIDE the recommendation it is making.
              Standing alone above the card it had nothing to align to and
              read as a page header; here it reads as the byline on a specific
              piece of advice, which is what it actually is. */}
          <div className="flex items-start justify-between gap-2 border-b border-panel-hairline pb-5">
            <VectorMark subtitle="Your AI flight trainer" onPanel />
            {/* "Chair-fly" is jargon and "5-minute review" is a promise, not
                a description. Both need one tap of explanation available. */}
            <InfoTip label="What Vector can do here" onPanel>
              <span className="flex flex-col gap-2.5">
                <span>
                  <strong className="font-semibold text-foreground">5-minute review</strong> &mdash; a short
                  explanation of this one skill in plain language, ending with a check that it stuck.
                </span>
                <span>
                  <strong className="font-semibold text-foreground">Quiz</strong> &mdash; three questions drawn from
                  your own flight, not a written-test bank.
                </span>
                <span>
                  <strong className="font-semibold text-foreground">Chair-fly</strong> &mdash; fly the scenario in
                  your head. Vector stops at each decision point and asks what you&rsquo;d do.
                </span>
                <span>
                  <strong className="font-semibold text-foreground">Ask</strong> &mdash; anything about this flight,
                  this skill, or what your instructor meant.
                </span>
              </span>
            </InfoTip>
          </div>

          <p className="mt-5 text-[15px] leading-relaxed text-panel-foreground-soft">
            Starting where your last flight ended &mdash; {LAST_FLIGHT.lesson} with {INSTRUCTOR.firstName}.
          </p>

          <div className="mt-6">
            <PanelEyebrow className={stateTone(recommended.state, true).text}>{recommended.state}</PanelEyebrow>
          </div>
          <PanelHeadline>{recommended.skill}</PanelHeadline>
          <div className="mt-2">
            <AcsBadge area={recommended.acsArea} onPanel />
          </div>

          {/* Why THIS one. The two ratings side by side is the whole
              argument for spending four minutes on a skill she thinks is
              already fine, so it goes above the evidence rather than being
              left for her to infer from it. */}
          {drill ? (
            <p className="mt-4 text-[15px] leading-relaxed text-panel-foreground-soft">
              You called this <span className="font-semibold text-panel-foreground">{drill.reason.studentLabel}</span>.{" "}
              {drill.reason.instructorName} called it{" "}
              <span className="font-semibold text-panel-foreground">{drill.reason.instructorLabel}</span>.
            </p>
          ) : null}

          {/* The reason, in the instructor's own words. A recommendation
              without its evidence is just a suggestion. */}
          <div className="mt-5">
            <Evidence
              label={`${INSTRUCTOR.firstName} · ${LAST_FLIGHT.date}`}
              tone="instructor"
              text={recommended.instructorEvidence}
              onPanel
            />
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            {/* One recommendation with its reason, and the rest demoted. Four
                equal buttons is a tool tray, and a tool tray hands the
                decision back to a student who opened the app because she did
                not have one. */}
            {drill ? (
              <>
                <PanelButton href={CHAIR_FLY_HREF}>
                  Start chair flying
                  <ArrowRight className="size-[18px]" aria-hidden />
                </PanelButton>
                <p className="px-1 text-[14px] text-panel-foreground-soft">
                  About {drill.estimatedMinutes} minutes · rehearse it before {NEXT_LESSON.date}
                </p>
              </>
            ) : (
              <PanelButton onClick={() => setMode("review")}>
                Start 5-minute review
                <ArrowRight className="size-[18px]" aria-hidden />
              </PanelButton>
            )}
            <div className="mt-1.5 flex gap-2.5">
              {drill ? (
                <SecondaryButton onClick={() => setMode("review")} onPanel>
                  Review
                </SecondaryButton>
              ) : null}
              <SecondaryButton onClick={() => setMode("quiz")} onPanel>
                Quiz
              </SecondaryButton>
              <SecondaryButton onClick={() => setMode("ask")} onPanel>
                Ask
              </SecondaryButton>
            </div>
          </div>
        </Panel>
      </Section>

      <Section title={<>Still working on</>}>
        <div className="flex flex-col">
          {open.map((s) => (
            <Link
              key={s.slug}
              href={`/prototype/vector/progress/${s.slug}`}
              className="flex min-h-[68px] items-center gap-4 border-b border-hairline py-4 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-medium text-foreground">{s.skill}</p>
                <StateLabel state={s.state} />
              </div>
              <SkillMeter score={s.score} max={s.max} state={s.state} />
              <ChevronRight className="size-4 shrink-0 text-foreground-faint" aria-hidden />
            </Link>
          ))}
        </div>
      </Section>
    </Screen>
  );
}
