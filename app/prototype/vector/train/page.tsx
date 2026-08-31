"use client";

import { useState } from "react";
import { ClipboardCheck, Plane, Repeat, BookOpen } from "lucide-react";
import { VectorPanel } from "@/components/prototype/vector-panel";
import { KnowledgeCheck } from "@/components/prototype/knowledge-check";
import { ChairFly } from "@/components/prototype/chair-fly";
import { CONCEPTS, INSTRUCTOR, RECURRING, SKILL_SCORES, SUGGESTED } from "@/lib/prototype/vector-data";

type Mode = "menu" | "review" | "quiz" | "chair";

/**
 * Train answers: what can I do right now to get better?
 *
 * One activity at a time. The previous prototype stacked the review, the
 * check and the chair-fly on a single scroll, which made all three look
 * optional -- picking one and committing the screen to it is what makes this
 * feel active rather than informational.
 */
export default function TrainPage() {
  const [mode, setMode] = useState<Mode>("menu");
  const crosswind = CONCEPTS["crosswind-correction-through-touchdown"]!;
  const open = SKILL_SCORES.filter((s) => s.state !== "Meets Standard");

  if (mode !== "menu") {
    return (
      <div className="flex flex-col gap-5 px-5 pt-6">
        <button onClick={() => setMode("menu")} className="self-start text-sm font-medium text-foreground-faint hover:text-brand">
          ← Training
        </button>
        {mode === "quiz" ? <KnowledgeCheck /> : null}
        {mode === "chair" ? <ChairFly /> : null}
        {mode === "review" ? (
          <div className="rounded-2xl border border-hairline p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand">Quick review</p>
            <h2 className="mt-1.5 text-xl font-semibold leading-tight text-foreground">{crosswind.title}</h2>
            <div className="mt-4 border-l-2 border-brand pl-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">{INSTRUCTOR.firstName}</p>
              <p className="mt-0.5 text-sm italic text-foreground-soft">&ldquo;{crosswind.instructorMeant}&rdquo;</p>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-foreground-soft">{crosswind.whyItHappens}</p>
            <ul className="mt-4 flex flex-col gap-2">
              {crosswind.nextTime.map((n) => (
                <li key={n} className="flex items-start gap-2.5 text-[15px] text-foreground">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                  {n}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-foreground-faint">{crosswind.sources[0]}</p>
            <button
              onClick={() => setMode("quiz")}
              className="mt-5 w-full rounded-xl bg-brand px-4 py-3 text-[15px] font-semibold text-brand-foreground"
            >
              Check my understanding
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-5 pt-6">
      <h1 className="text-[32px] font-semibold leading-none tracking-tight text-foreground">Train</h1>

      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-faint">Today&rsquo;s training</h2>
        <div className="mt-3 flex flex-col gap-2.5">
          <Action icon={BookOpen} label="Quick review" meta="2 min" onClick={() => setMode("review")} />
          <Action icon={ClipboardCheck} label="3-question check" meta="From Aug 29" onClick={() => setMode("quiz")} />
          <Action icon={Plane} label="Chair fly" meta="Crosswind at KSQL" onClick={() => setMode("chair")} />
        </div>
      </section>

      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-faint">Still working on</h2>
        <div className="mt-3 flex flex-col gap-2.5">
          {open.map((s) => (
            <div key={s.skill} className="rounded-xl border border-hairline px-4 py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex-1 text-[15px] font-medium text-foreground">{s.skill}</span>
                {s.recurring ? <Repeat className="size-3.5 text-amber" /> : null}
                <span className="text-sm font-semibold tabular-nums text-foreground-soft">
                  {s.score}/{s.max}
                </span>
              </div>
              <p className="mt-1 text-sm text-foreground-faint">{s.next}</p>
            </div>
          ))}
          {RECURRING ? (
            <p className="text-xs text-amber">
              {RECURRING.skill} has appeared in {RECURRING.lessonCount} lessons with {RECURRING.instructorCount}{" "}
              instructors.
            </p>
          ) : null}
        </div>
      </section>

      <VectorPanel
        context="Crosswind landings · Jake · Aug 29"
        suggestions={SUGGESTED.nextFlight}
        onAction={(target) => {
          if (target === "quiz") setMode("quiz");
          else if (target === "chair-fly") setMode("chair");
        }}
      />
    </div>
  );
}

function Action({
  icon: Icon,
  label,
  meta,
  onClick,
}: {
  icon: typeof BookOpen;
  label: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-xl border border-hairline px-4 py-4 text-left transition-colors hover:border-brand">
      <Icon className="size-5 shrink-0 text-brand" />
      <span className="flex-1 text-[15px] font-medium text-foreground">{label}</span>
      <span className="text-sm text-foreground-faint">{meta}</span>
    </button>
  );
}
