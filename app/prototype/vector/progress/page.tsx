"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Info } from "lucide-react";
import { PageTitle, Screen, Section, Segmented, SkillMeter, StateLabel } from "@/components/prototype/ui";
import { INSTRUCTOR, SKILL_SCORES, skillsByAcsArea, type SkillScore } from "@/lib/prototype/vector-data";

/**
 * Progress answers: what is improving and what still needs work?
 *
 * Two views of the same four skills. SKILLS is the default because that is how
 * a student thinks about their own flying; ACS is the second view, for when
 * they want to see the same thing the way the checkride is organized. Neither
 * is a matrix, and neither expands everything at once -- the evidence, the
 * trend, Vector's read and the next action all live on the skill's own screen,
 * because a list where every row is already open is a report rather than an app.
 *
 * Still no aggregate, and never will be. See design-system/afterflight/MASTER.md §9.
 */
export default function ProgressPage() {
  const [view, setView] = useState<"skills" | "acs">("skills");
  const [showWhy, setShowWhy] = useState(false);

  return (
    <Screen>
      <PageTitle>Progress</PageTitle>

      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: "skills", label: "Skills" },
          { value: "acs", label: "ACS" },
        ]}
      />

      {view === "skills" ? (
        <Section>
          <div className="flex flex-col">
            {SKILL_SCORES.map((s) => (
              <SkillRow key={s.slug} skill={s} />
            ))}
          </div>
        </Section>
      ) : (
        <div className="flex flex-col gap-7">
          {skillsByAcsArea().map((group) => (
            <Section key={group.area}>
              {/* The Area of Operation, in words. Task codes stay on the
                  skill's own screen, where someone who wants them will look. */}
              <h2 className="text-[13px] font-semibold uppercase leading-snug tracking-[0.08em] text-foreground-faint">
                {group.area}
              </h2>
              <div className="flex flex-col">
                {group.skills.map((s) => (
                  <SkillRow key={s.slug} skill={s} />
                ))}
              </div>
            </Section>
          ))}
        </div>
      )}

      <div>
        <button
          onClick={() => setShowWhy(!showWhy)}
          aria-expanded={showWhy}
          className="flex min-h-[44px] cursor-pointer items-center gap-2 text-left text-[13px] leading-relaxed text-foreground-faint"
        >
          <Info className="size-3.5 shrink-0" aria-hidden />
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

/** One tappable row. The meter carries the level; a separate dot would say it twice. */
function SkillRow({ skill }: { skill: SkillScore }) {
  return (
    <Link
      href={`/prototype/vector/progress/${skill.slug}`}
      className="flex min-h-[68px] items-center gap-4 border-b border-hairline py-4 last:border-b-0"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-medium leading-tight text-foreground">{skill.skill}</p>
        <StateLabel state={skill.state} />
      </div>
      <SkillMeter score={skill.score} max={skill.max} state={skill.state} />
      <ChevronRight className="size-4 shrink-0 text-foreground-faint" aria-hidden />
    </Link>
  );
}
