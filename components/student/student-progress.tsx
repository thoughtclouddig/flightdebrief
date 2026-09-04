"use client";

import { useState, type ReactNode } from "react";
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
} from "@/components/student/ui";
import type { SkillState } from "@/lib/student/state-tone";

export interface ProgressSkillRow {
  slug: string;
  href: string;
  label: string;
  score: number;
  max: number;
  state: SkillState;
}

export interface ProgressAcsRow {
  label: string;
  /** Published task code, when the row is a real ACS task. Null for production's skill-granularity rows -- see this file's doc comment. */
  code: string | null;
  /** The contributing skills behind this row, each a real link. Empty when the row already IS a single skill (production). */
  skills: { href: string; label: string }[];
  state: SkillState | null;
  score: number | null;
  max: number;
}

export interface ProgressAcsAreaGroup {
  area: string;
  rows: ProgressAcsRow[];
}

export interface ProgressAcsData {
  meetingStandard: number;
  assessed: number;
  notAssessed: number;
  total: number;
  areas: ProgressAcsAreaGroup[];
  /** "tasks" for the prototype's real Area/Task structure, "skills" for production's Area-level-only mapping -- see this file's doc comment. */
  unitLabel: string;
  /** The readiness panel's "how this is counted" explainer -- differs because the two really do count different things. */
  readinessInfoTip: ReactNode;
}

/**
 * Progress, in full -- shared between the fixture demo
 * (app/prototype/vector/progress) and the real drill-down (app/(product)/progress).
 *
 * ACS granularity is a genuine, disclosed difference between the two callers,
 * not a redesign: the prototype's fixture data models the full published
 * Area -> Task -> Skill hierarchy (lib/prototype/acs.ts), but production's
 * real ACS mapping (lib/acs.ts's PRIVATE_ACS_AREAS) only goes to Area level --
 * there is no verified Task-level catalog to roll real skills up into. So
 * production's ACS rows are one skill each (code: null, skills: []) rather
 * than a task with skills under it, and `unitLabel` says "skills" instead of
 * "tasks" in the readiness panel. Same screen, same tabs, same three-state
 * model, same "Not assessed yet" honesty -- just a coarser real join.
 */
export function StudentProgress({
  title = "Progress",
  skills,
  acs,
  extra,
}: {
  title?: string;
  skills: ProgressSkillRow[];
  acs: ProgressAcsData;
  /** Production-only content with no prototype equivalent (free-usage banner, action items, recurring themes) -- rendered above the tabs, same pattern as Debrief Detail's children slot. */
  extra?: ReactNode;
}) {
  const [view, setView] = useState<"skills" | "acs">("skills");
  const [showWhy, setShowWhy] = useState(false);

  return (
    <Screen>
      <PageTitle>{title}</PageTitle>

      {extra}

      <div className="flex flex-col gap-3">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: "skills", label: "Skills" },
            { value: "acs", label: "ACS" },
          ]}
        />
        <p className="px-1.5 text-[14px] leading-relaxed text-foreground-faint">
          {view === "skills"
            ? "Everyday training progress — what you're getting better at, flight to flight."
            : "The same evidence, organized the way the checkride is."}
        </p>
      </div>

      {view === "skills" ? (
        <Section>
          <div className="flex flex-col">
            {skills.map((s) => (
              <SkillRow key={s.slug} skill={s} />
            ))}
          </div>
        </Section>
      ) : (
        <AcsView acs={acs} />
      )}

      <div>
        <button
          onClick={() => setShowWhy(!showWhy)}
          aria-expanded={showWhy}
          className="flex min-h-[44px] cursor-pointer items-center gap-2 text-left text-[13px] leading-relaxed text-foreground-faint"
        >
          <Info className="size-3.5 shrink-0" aria-hidden />
          {view === "skills"
            ? "Scores are skill-specific and based on your latest instructor feedback."
            : `${acs.unitLabel[0]!.toUpperCase()}${acs.unitLabel.slice(1)} levels come from the same instructor feedback, grouped by ACS ${acs.unitLabel === "tasks" ? "task" : "area"}.`}
        </button>
        {showWhy ? (
          <p className="pb-2 pl-[22px] text-[13px] leading-relaxed text-foreground-faint">
            There&rsquo;s no overall score or readiness percentage. Each score reflects one skill and the evidence
            behind it &mdash; whether you&rsquo;re ready to solo or take a checkride is your instructor&rsquo;s call,
            not ours.
          </p>
        ) : null}
      </div>
    </Screen>
  );
}

function SkillRow({ skill }: { skill: ProgressSkillRow }) {
  return (
    <Link
      href={skill.href}
      className="flex min-h-[68px] items-center gap-4 border-b border-hairline py-4 last:border-b-0"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-medium leading-tight text-foreground">{skill.label}</p>
        <StateLabel state={skill.state} />
      </div>
      <SkillMeter score={skill.score} max={skill.max} state={skill.state} />
      <ChevronRight className="size-4 shrink-0 text-foreground-faint" aria-hidden />
    </Link>
  );
}

function AcsView({ acs }: { acs: ProgressAcsData }) {
  return (
    <>
      <Panel>
        <div className="flex items-start justify-between gap-2">
          <PanelEyebrow>Checkride readiness</PanelEyebrow>
          <InfoTip label="How this is counted" onPanel>
            {acs.readinessInfoTip}
          </InfoTip>
        </div>
        <PanelHeadline>
          {acs.meetingStandard} of {acs.assessed} assessed {acs.unitLabel} meeting standard
        </PanelHeadline>
        <PanelMeta>
          {acs.notAssessed} of the {acs.total} {acs.unitLabel} in these areas haven&rsquo;t come up yet.
        </PanelMeta>
      </Panel>

      {acs.areas.map((group) => (
        <Section key={group.area} title={<>{group.area}</>}>
          <div className="flex flex-col">
            {group.rows.map((row) => (
              <AcsRow key={row.code ?? row.label} row={row} />
            ))}
          </div>
        </Section>
      ))}
    </>
  );
}

function AcsRow({ row }: { row: ProgressAcsRow }) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-hairline py-4 last:border-b-0">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-medium leading-snug text-foreground">{row.label}</p>
          {row.code ? <p className="mt-0.5 text-[14px] tabular-nums text-foreground-faint">{row.code}</p> : null}
        </div>
        {row.state ? (
          <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
            <SkillMeter score={row.score!} max={row.max} state={row.state} />
            <StateLabel state={row.state} />
          </div>
        ) : (
          <p className="shrink-0 pt-0.5 text-[14px] text-foreground-faint">Not assessed yet</p>
        )}
      </div>

      {row.skills.length > 0 ? (
        <p className="text-[14px] leading-relaxed text-foreground-soft">
          From{" "}
          {row.skills.map((s, i) => (
            <span key={s.href}>
              {i > 0 ? <span className="px-1 text-foreground-faint">·</span> : null}
              <Link
                href={s.href}
                className="font-medium text-foreground underline decoration-hairline underline-offset-4"
              >
                {s.label}
              </Link>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
