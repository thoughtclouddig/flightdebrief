"use client";

import { useState } from "react";
import { ChevronDown, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { INSTRUCTOR, RECURRING, SKILL_SCORES, type SkillScore, type SkillState } from "@/lib/prototype/vector-data";

/**
 * Progress: three summary counts, then skills, then detail on tap.
 *
 * Not an analytics dashboard. The previous version showed improving skills,
 * unresolved skills, the recurrence timeline and the full score list at once,
 * all at the same visual weight -- which is a report. Here the default view
 * is four rows and three numbers, and everything else is one tap down.
 *
 * There is deliberately no total. A per-skill score is evidence-backed and
 * actionable; an aggregate would be a readiness claim, and readiness is the
 * instructor's call.
 */
export default function ProgressPage() {
  const [open, setOpen] = useState<string | null>(null);
  const improving = SKILL_SCORES.filter((s) => s.state === "Improving").length;
  const working = SKILL_SCORES.filter((s) => s.state === "Needs Work").length;
  const standard = SKILL_SCORES.filter((s) => s.state === "Meets Standard").length;

  return (
    <div className="flex flex-col gap-6 px-5 pt-6">
      <h1 className="text-[32px] font-semibold leading-none tracking-tight text-foreground">Progress</h1>

      <div className="grid grid-cols-3 gap-2.5">
        <Summary value={improving} label="Improving" tone="text-brand" />
        <Summary value={working} label="Working on" tone="text-amber" />
        <Summary value={standard} label="At standard" tone="text-good" />
      </div>

      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-faint">Skills</h2>
        <div className="mt-3 flex flex-col gap-2.5">
          {SKILL_SCORES.map((s) => (
            <SkillRow key={s.skill} skill={s} open={open === s.skill} onToggle={() => setOpen(open === s.skill ? null : s.skill)} />
          ))}
        </div>
      </section>

      <p className="rounded-xl bg-surface-sunken px-4 py-3.5 text-xs leading-relaxed text-foreground-faint">
        These are per-skill and come from what {INSTRUCTOR.firstName} said. AfterFlight doesn&rsquo;t roll them into an
        overall score or a readiness percentage &mdash; whether you&rsquo;re ready for anything is his call.
      </p>
    </div>
  );
}

function Summary({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="rounded-xl border border-hairline px-3 py-4 text-center">
      <p className={cn("text-3xl font-semibold tabular-nums", tone)}>{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wide text-foreground-faint">{label}</p>
    </div>
  );
}

function SkillRow({ skill, open, onToggle }: { skill: SkillScore; open: boolean; onToggle: () => void }) {
  return (
    <div className={cn("rounded-xl border transition-colors", open ? "border-brand/50" : "border-hairline")}>
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-4 text-left" aria-expanded={open}>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-foreground">{skill.skill}</p>
          <p className={cn("mt-0.5 text-xs font-semibold uppercase tracking-wide", stateTone(skill.state))}>
            {skill.state}
          </p>
        </div>
        {skill.recurring ? <Repeat className="size-3.5 shrink-0 text-amber" /> : null}
        <span className="text-lg font-semibold tabular-nums text-foreground">
          {skill.score}
          <span className="text-sm text-foreground-faint">/{skill.max}</span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-foreground-faint transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="flex flex-col gap-3 border-t border-hairline px-4 py-4">
          <Evidence tone="border-l-brand" label={INSTRUCTOR.firstName} labelTone="text-brand" text={skill.instructorEvidence} quoted />
          {skill.studentTake ? (
            <Evidence tone="border-l-good" label="You" labelTone="text-good" text={skill.studentTake} />
          ) : null}
          <Evidence tone="border-l-hairline" label="Vector" labelTone="text-foreground-faint" text={skill.vectorRead} />
          {skill.recurring ? (
            <p className="text-xs text-amber">
              {RECURRING.lessonCount} lessons &middot; {RECURRING.instructorCount} instructors
            </p>
          ) : null}
          <div className="rounded-xl bg-surface-sunken px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-faint">Next</p>
            <p className="mt-0.5 text-sm text-foreground-soft">{skill.next}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Evidence({
  tone,
  label,
  labelTone,
  text,
  quoted,
}: {
  tone: string;
  label: string;
  labelTone: string;
  text: string;
  quoted?: boolean;
}) {
  return (
    <div className={cn("border-l-2 pl-3", tone)}>
      <p className={cn("text-[11px] font-semibold uppercase tracking-wide", labelTone)}>{label}</p>
      <p className={cn("mt-0.5 text-sm text-foreground-soft", quoted && "italic")}>{quoted ? `"${text}"` : text}</p>
    </div>
  );
}

function stateTone(state: SkillState): string {
  return state === "Meets Standard" ? "text-good" : state === "Improving" ? "text-brand" : "text-amber";
}
