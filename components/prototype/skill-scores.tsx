"use client";

import { useState } from "react";
import { ChevronDown, Gauge, Repeat } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { INSTRUCTOR, SKILL_SCORES, type SkillScore, type SkillState } from "@/lib/prototype/vector-data";

/**
 * Per-skill scores, each with the evidence that produced it.
 *
 * The score is allowed to be a number because it is attached to one skill
 * and is one tap from the sentence the instructor actually said. What is
 * never rendered anywhere is an aggregate -- summing these into an overall
 * figure would turn "here is where you are on crosswinds" into "here is how
 * ready you are", which is a certification claim the product has no standing
 * to make.
 *
 * The four labelled blocks in the expanded state are the whole point: the
 * instructor's words, her words, Vector's reading, and what to do next --
 * kept visually distinct so a student is never in doubt about who is
 * talking. Vector's line is inference and is labelled as such.
 */
export function SkillScores() {
  // Crosswind opens by default: it is the skill Thursday is about, and an
  // all-collapsed list makes the student hunt for the thing that matters.
  const [open, setOpen] = useState<string | null>(SKILL_SCORES[0]?.skill ?? null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="size-4 text-brand" />
          Where each skill stands
        </CardTitle>
        <CardDescription>
          From {INSTRUCTOR.firstName}&rsquo;s debrief on Aug 29. Tap any skill for the evidence behind it.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {SKILL_SCORES.map((s) => (
          <SkillRow key={s.skill} skill={s} open={open === s.skill} onToggle={() => setOpen(open === s.skill ? null : s.skill)} />
        ))}
        {/* Says out loud what the absence of a total means, so it reads as a
            deliberate boundary rather than a missing feature. */}
        <p className="mt-1 rounded-lg bg-surface-sunken px-3 py-2.5 text-xs text-foreground-faint">
          These are per-skill and come from what {INSTRUCTOR.firstName} said. AfterFlight doesn&rsquo;t roll them into an
          overall score or a readiness percentage &mdash; whether you&rsquo;re ready for anything is his call.
        </p>
      </CardContent>
    </Card>
  );
}

function SkillRow({ skill, open, onToggle }: { skill: SkillScore; open: boolean; onToggle: () => void }) {
  return (
    <div className={cn("rounded-lg border transition-colors", open ? "border-brand/40" : "border-hairline")}>
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-3.5 py-3 text-left" aria-expanded={open}>
        <span className="flex-1 text-sm font-medium text-foreground">{skill.skill}</span>
        {skill.recurring ? (
          <span title="Also recurring across lessons">
            <Repeat className="size-3.5 text-amber" />
          </span>
        ) : null}
        <ScorePips score={skill.score} max={skill.max} state={skill.state} />
        <span className="w-9 text-right text-sm font-semibold tabular-nums text-foreground">
          {skill.score}/{skill.max}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-foreground-faint transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="flex flex-col gap-3 border-t border-hairline px-3.5 py-3">
          <StateBadge state={skill.state} />

          <Block label={`What ${INSTRUCTOR.firstName} said`}>
            <span className="italic">&ldquo;{skill.instructorEvidence}&rdquo;</span>
          </Block>

          {skill.studentTake ? <Block label="What you said">{skill.studentTake}</Block> : null}

          <Block label="Vector's read" accent>
            {skill.vectorRead}
          </Block>

          {skill.recurring ? (
            <p className="text-xs text-amber">
              Also showing up across {skill.recurring.lessons} lessons with {skill.recurring.instructors} instructors.
            </p>
          ) : null}

          <Block label="What moves this forward">{skill.next}</Block>
        </div>
      ) : null}
    </div>
  );
}

function Block({ label, children, accent }: { label: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={accent ? "rounded-lg bg-surface-sunken px-3 py-2" : undefined}>
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">{label}</p>
      <p className="mt-0.5 text-sm text-foreground-soft">{children}</p>
    </div>
  );
}

/** Visual position at a glance. Same information as the fraction, faster to read. */
function ScorePips({ score, max, state }: { score: number; max: number; state: SkillState }) {
  const tone = state === "Meets Standard" ? "bg-good" : state === "Improving" ? "bg-brand" : "bg-amber";
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={cn("h-1.5 w-4 rounded-full", i < score ? tone : "bg-hairline")} />
      ))}
    </span>
  );
}

function StateBadge({ state }: { state: SkillState }) {
  const tone =
    state === "Meets Standard"
      ? "border-good/50 text-good"
      : state === "Improving"
        ? "border-brand/50 text-brand"
        : "border-amber/50 text-amber";
  return (
    <span className={cn("self-start rounded-full border px-2.5 py-0.5 text-xs font-semibold", tone)}>{state}</span>
  );
}
