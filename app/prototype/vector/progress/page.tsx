"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Evidence, PageTitle, Score, Screen, Section, SectionLabel, StateLabel, stateTone } from "@/components/prototype/ui";
import { INSTRUCTOR, RECURRING, SKILL_SCORES, type SkillScore } from "@/lib/prototype/vector-data";

/**
 * Progress answers: what is improving and what still needs work?
 *
 * Four rows, a state dot, a score. Everything else -- the instructor's quote,
 * the trend, Vector's read, the next action -- is behind the row, because a
 * list where every item is already expanded is a report rather than a screen.
 *
 * Still no aggregate. The disclaimer that used to run four lines is now one
 * sentence with the reasoning behind an info tap; a defensive paragraph on
 * every visit made the absence feel like an apology.
 */
export default function ProgressPage() {
  const [open, setOpen] = useState<string | null>(null);
  const [showWhy, setShowWhy] = useState(false);

  return (
    <Screen>
      <PageTitle>Progress</PageTitle>

      <Section>
        <SectionLabel>Skills</SectionLabel>
        <div className="flex flex-col">
          {SKILL_SCORES.map((s) => (
            <SkillRow key={s.skill} skill={s} open={open === s.skill} onToggle={() => setOpen(open === s.skill ? null : s.skill)} />
          ))}
        </div>
      </Section>

      <div>
        <button
          onClick={() => setShowWhy(!showWhy)}
          className="flex min-h-[44px] items-center gap-2 text-left text-[13px] leading-relaxed text-foreground-faint"
        >
          <Info className="size-3.5 shrink-0" />
          Scores are skill-specific and based on your latest instructor feedback.
        </button>
        {showWhy ? (
          <p className="pb-2 pl-[22px] text-[13px] leading-relaxed text-foreground-faint">
            There&rsquo;s no overall score or readiness percentage. Each score reflects one skill and the evidence
            behind it &mdash; whether you&rsquo;re ready to solo or take a checkride is {INSTRUCTOR.firstName}&rsquo;s
            call, not ours.
          </p>
        ) : null}
      </div>
    </Screen>
  );
}

function SkillRow({ skill, open, onToggle }: { skill: SkillScore; open: boolean; onToggle: () => void }) {
  const tone = stateTone(skill.state);
  return (
    <div className="border-b border-hairline last:border-b-0">
      <button onClick={onToggle} className="flex min-h-[64px] w-full items-center gap-4 py-4 text-left" aria-expanded={open}>
        <span className={cn("size-2 shrink-0 rounded-full", tone.dot)} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-medium leading-tight text-foreground">{skill.skill}</p>
          <StateLabel state={skill.state} />
        </div>
        <Score score={skill.score} max={skill.max} />
        <ChevronDown className={cn("size-4 shrink-0 text-foreground-faint transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="flex flex-col gap-4 pb-5">
          <Evidence label={INSTRUCTOR.firstName} tone="instructor" text={skill.instructorEvidence} />
          {skill.recurring ? (
            <div>
              <p className="text-[13px] font-medium text-foreground-faint">Trend</p>
              <p className="mt-0.5 text-[15px] text-foreground-soft">
                {RECURRING.lessonCount} recent lessons · {RECURRING.instructorCount} instructors
              </p>
            </div>
          ) : null}
          <Link
            href="/prototype/vector/train"
            className="flex min-h-[44px] items-center justify-center rounded-xl border border-hairline text-[15px] font-medium text-foreground"
          >
            Train with Vector
          </Link>
        </div>
      ) : null}
    </div>
  );
}
