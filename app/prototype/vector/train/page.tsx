"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { VectorPanel } from "@/components/prototype/vector-panel";
import { KnowledgeCheck } from "@/components/prototype/knowledge-check";
import { ChairFly } from "@/components/prototype/chair-fly";
import {
  Card,
  Evidence,
  PageTitle,
  PrimaryButton,
  PrimaryCard,
  SkillMeter,
  Screen,
  Section,
  SectionLabel,
  SecondaryButton,
  StateLabel,
  VectorMark,
} from "@/components/prototype/ui";
import { CONCEPTS, INSTRUCTOR, LAST_FLIGHT, SKILL_SCORES, SUGGESTED } from "@/lib/prototype/vector-data";

type Mode = "menu" | "review" | "quiz" | "chair" | "ask";

/**
 * Train answers: what should I practise right now?
 *
 * Vector RECOMMENDS one thing rather than presenting a menu. Four equal
 * buttons is a tool tray, and a tool tray puts the decision back on a
 * student who opened the app precisely because they did not know what to
 * work on. The recommendation is the lowest-scoring open skill, with the
 * instructor's own words as the reason.
 */
export default function TrainPage() {
  const [mode, setMode] = useState<Mode>("menu");
  const crosswind = CONCEPTS["crosswind-correction-through-touchdown"]!;
  const open = SKILL_SCORES.filter((s) => s.state !== "Meets Standard");
  // Weakest open skill wins. Deterministic, and it matches what Jake left open.
  const recommended = [...open].sort((a, b) => a.score / a.max - b.score / b.max)[0]!;

  if (mode !== "menu") {
    return (
      <Screen>
        <button onClick={() => setMode("menu")} className="-mb-4 self-start py-2 text-[15px] font-medium text-brand">
          ← Training
        </button>
        {mode === "quiz" ? <KnowledgeCheck /> : null}
        {mode === "chair" ? <ChairFly /> : null}
        {mode === "ask" ? (
          <VectorPanel
            context={`${LAST_FLIGHT.lesson} · ${INSTRUCTOR.firstName} · ${LAST_FLIGHT.date}`}
            suggestions={SUGGESTED.nextFlight}
            onAction={(t) => setMode(t === "quiz" ? "quiz" : t === "chair-fly" ? "chair" : "menu")}
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
              <PrimaryButton onClick={() => setMode("quiz")}>Check my understanding</PrimaryButton>
            </div>
          </Card>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen>
      <PageTitle>Train</PageTitle>

      {/* Vector introduced with its descriptor, not just its name. */}
      <VectorMark
        subtitle="Your AI flight trainer"
        context={`Vector starts where your last flight ended · ${LAST_FLIGHT.lesson} · ${INSTRUCTOR.firstName}`}
      />

      <Section>
        <SectionLabel>Today Vector recommends</SectionLabel>
        <PrimaryCard>
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-brand">
            {recommended.state}
          </p>
          <p className="mt-2 text-[26px] font-semibold leading-tight tracking-tight">{recommended.skill}</p>
          <p className="mt-3 text-[15px] leading-relaxed opacity-75">
            &ldquo;{recommended.instructorEvidence}&rdquo;
          </p>
          <p className="mt-1.5 text-[13px] opacity-50">{INSTRUCTOR.firstName} · {LAST_FLIGHT.date}</p>
        </PrimaryCard>

        <div className="mt-1 flex flex-col gap-2.5">
          <PrimaryButton onClick={() => setMode("review")}>
            Start 5-minute review
            <ArrowRight className="size-[18px]" />
          </PrimaryButton>
          <div className="flex gap-2.5">
            <SecondaryButton onClick={() => setMode("quiz")}>Quiz me</SecondaryButton>
            <SecondaryButton onClick={() => setMode("chair")}>Chair-fly</SecondaryButton>
            <SecondaryButton onClick={() => setMode("ask")}>Ask</SecondaryButton>
          </div>
        </div>
      </Section>

      <Section>
        <SectionLabel>Still working on</SectionLabel>
        <div className="flex flex-col">
          {open.map((s) => (
            <div key={s.skill} className="flex items-center gap-4 border-b border-hairline py-4 last:border-b-0">
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-medium text-foreground">{s.skill}</p>
                <StateLabel state={s.state} />
              </div>
              <SkillMeter score={s.score} max={s.max} state={s.state} />
            </div>
          ))}
        </div>
      </Section>
    </Screen>
  );
}
