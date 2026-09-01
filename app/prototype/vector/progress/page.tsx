"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Info } from "lucide-react";
import {
  InfoTip,
  PageTitle,
  Panel,
  PanelEyebrow,
  PanelHeadline,
  PanelMeta,
  Screen,
  Section,
  Segmented,
  SkillMeter,
  StateLabel,
} from "@/components/prototype/ui";
import { INSTRUCTOR, SKILL_SCORES, type SkillScore } from "@/lib/prototype/vector-data";
import { acsReadiness, type TaskProgress } from "@/lib/prototype/acs";

/**
 * Progress answers two different questions, and the tabs must not be the same
 * list twice.
 *
 *   SKILLS  "What am I getting better at?"  -- everyday training progress, in
 *           the student's own vocabulary, organized the way she thinks about
 *           her flying. A flat, tappable list of the things she is working on.
 *
 *   ACS     "How am I tracking against what I have to demonstrate on the
 *           checkride?" -- the published Area of Operation -> Task structure,
 *           which she does not get to choose, led by a readiness summary and
 *           including the tasks that have NOT come up yet.
 *
 * That last part is the real difference and it is why the two views cannot be
 * the same rows regrouped. A skills list only ever contains what has been
 * assessed. The checkride question is mostly about what has not been.
 *
 * Same underlying evidence, same three-state model, no aggregate score and no
 * readiness verdict -- see design-system/afterflight/MASTER.md §9 and §11.
 */
export default function ProgressPage() {
  const [view, setView] = useState<"skills" | "acs">("skills");
  const [showWhy, setShowWhy] = useState(false);

  return (
    <Screen>
      <PageTitle>Progress</PageTitle>

      <div className="flex flex-col gap-3">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: "skills", label: "Skills" },
            { value: "acs", label: "ACS" },
          ]}
        />
        {/* One line naming what this view is for. The tabs are two words each
            and "ACS" is an acronym a pre-solo student may never have met. */}
        <p className="px-1.5 text-[14px] leading-relaxed text-foreground-faint">
          {view === "skills"
            ? "Everyday training progress — what you're getting better at, flight to flight."
            : "The same evidence, organized the way the checkride is."}
        </p>
      </div>

      {view === "skills" ? <SkillsView /> : <AcsView />}

      <div>
        <button
          onClick={() => setShowWhy(!showWhy)}
          aria-expanded={showWhy}
          className="flex min-h-[44px] cursor-pointer items-center gap-2 text-left text-[13px] leading-relaxed text-foreground-faint"
        >
          <Info className="size-3.5 shrink-0" aria-hidden />
          {view === "skills"
            ? "Scores are skill-specific and based on your latest instructor feedback."
            : "Task levels come from the same instructor feedback, grouped by ACS task."}
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

/* ------------------------------------------------------------------ skills */

/** Unchanged: the student-facing list, one tappable row per skill. */
function SkillsView() {
  return (
    <Section>
      <div className="flex flex-col">
        {SKILL_SCORES.map((s) => (
          <SkillRow key={s.slug} skill={s} />
        ))}
      </div>
    </Section>
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

/* --------------------------------------------------------------------- acs */

function AcsView() {
  const acs = acsReadiness();

  return (
    <>
      <Panel>
        <div className="flex items-start justify-between gap-2">
          <PanelEyebrow>Checkride readiness</PanelEyebrow>
          <InfoTip label="How this is counted" onPanel>
            <span className="flex flex-col gap-2.5">
              <span>
                A task counts as <strong className="font-semibold text-foreground">assessed</strong> once{" "}
                {INSTRUCTOR.firstName} has rated a skill under it. Most tasks here haven&rsquo;t come up in a lesson
                yet.
              </span>
              <span>
                A task sits at its <strong className="font-semibold text-foreground">weakest assessed skill</strong> —
                it isn&rsquo;t at standard while part of it isn&rsquo;t.
              </span>
              <span>
                There is no percentage and no overall verdict. Signing you off for a checkride is{" "}
                {INSTRUCTOR.firstName}&rsquo;s call.
              </span>
            </span>
          </InfoTip>
        </div>
        {/* Counts, not a verdict -- and the denominator is "assessed", not
            "total", so the number can never be read as "two-thirds ready". */}
        <PanelHeadline>
          {acs.meetingStandard} of {acs.assessed} assessed tasks meeting standard
        </PanelHeadline>
        <PanelMeta>
          {acs.notAssessed} of the {acs.total} tasks in these areas haven&rsquo;t come up yet.
        </PanelMeta>
      </Panel>

      {acs.areas.map((group) => (
        <Section key={group.area} title={<>{group.area}</>}>
          <div className="flex flex-col">
            {group.tasks.map((t) => (
              <TaskRow key={t.task.code} progress={t} />
            ))}
          </div>
        </Section>
      ))}
    </>
  );
}

/**
 * One published task.
 *
 * Not a link, unlike a skill row -- a task can have two skills under it, so
 * there is no single destination. The contributing skills are the links, which
 * also keeps every level next to the evidence that produced it.
 *
 * An unassessed task shows no meter at all. A 0-of-4 meter would claim the
 * instructor assessed this and found nothing, when in fact the lesson has not
 * happened.
 */
function TaskRow({ progress }: { progress: TaskProgress }) {
  const { task, skills, state, score, max } = progress;
  return (
    <div className="flex flex-col gap-1.5 border-b border-hairline py-4 last:border-b-0">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-medium leading-snug text-foreground">{task.name}</p>
          <p className="mt-0.5 text-[14px] tabular-nums text-foreground-faint">{task.code}</p>
        </div>
        {state ? (
          <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
            <SkillMeter score={score!} max={max} state={state} />
            <StateLabel state={state} />
          </div>
        ) : (
          <p className="shrink-0 pt-0.5 text-[14px] text-foreground-faint">Not assessed yet</p>
        )}
      </div>

      {skills.length > 0 ? (
        <p className="text-[14px] leading-relaxed text-foreground-soft">
          From{" "}
          {skills.map((s, i) => (
            <span key={s.slug}>
              {i > 0 ? <span className="px-1 text-foreground-faint">·</span> : null}
              {/* Ink, not orange. These are the third and fourth tappable
                  things on the screen and the color budget gives orange to
                  one action; an underline says "tappable" without spending it. */}
              <Link
                href={`/prototype/vector/progress/${s.slug}`}
                className="font-medium text-foreground underline decoration-hairline underline-offset-4"
              >
                {s.skill}
              </Link>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
