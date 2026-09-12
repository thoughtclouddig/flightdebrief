import type { ReactNode } from "react";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import { computeSkillProgression, meterScoreForSkillStatus, toneForSkillStatus } from "@/lib/skill-progress";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { acsAreaForSkill } from "@/lib/acs";
import { hasAuthoredScenario } from "@/lib/prototype/chair-fly";
import { skillLabel } from "@/lib/topics";
import { formatFlightDate } from "@/lib/utils";
import type { TrainingSkill } from "@/lib/types";
import type { SkillState } from "@/lib/student/state-tone";

export interface ProductionSkillDetailProps {
  label: string;
  score: number;
  max: number;
  state: SkillState;
  infoTipText: ReactNode;
  acsArea: string | null;
  comparison: null;
  latestEvidence: { label: string; text: string };
  recurring: { lessons: number; instructors: number } | null;
  trendPoints: { label: string; score: number; max: number; state: SkillState }[];
  vectorRead: null;
  /** Where "Train this with Vector" actually goes -- see this function's own doc comment. */
  trainHref: string;
}

/**
 * Real Skill Detail -- feeds components/student/progress/skill-detail.tsx
 * (the approved V2 presentation) from real training signals. Extracted
 * verbatim from app/(product)/progress/[skill]/page.tsx's own prior inline
 * logic (no behavior change), shared with app/v2/progress/[skill]/page.tsx's
 * own real-data branch. Returns null when the skill isn't a real, currently
 * progressing one for this student -- callers notFound() on null, same as
 * canonical always has.
 *
 * "Vector's read" and "How you both saw it" stay null -- see the shared
 * component's own doc comment for why those two are real capability gaps,
 * not omissions of convenience.
 *
 * trainHref used to be a plain string every caller hardcoded to "/train" --
 * "Train this with Vector" on Emergency Procedures and "Train this with
 * Vector" on Landings went to the exact same generic hub page, showing
 * whatever Vector's OVERALL top recommendation happened to be, unrelated to
 * the skill the student was just looking at. Now resolved here, same
 * skill-to-activity matching Next Flight uses: this skill's own Radio
 * Practice entry point when it's a radio-communications skill, the one real
 * authored Chair Fly scenario when this skill's label matches it, otherwise
 * the honest generic Train hub -- never a fabricated skill-specific link
 * where no real activity exists. hrefs.radioPracticeHref/chairFlyHref are
 * optional because /v2 has neither a real /practice/[id] nor its own Chair
 * Fly production route wired to this adapter yet -- omitting them there
 * just falls through to hrefs.trainHref, same as before this fix.
 */
export async function buildProductionSkillDetailProps(
  repo: Repository,
  viewer: Viewer,
  skillParam: string,
  hrefs: { trainHref: string; chairFlyHref?: string; radioPracticeHref?: string },
): Promise<ProductionSkillDetailProps | null> {
  const studentId = viewer.user.id;

  const [signals, memberships, brief] = await Promise.all([
    repo.listTrainingSignals({ studentId }),
    repo.listMembershipsForUser(studentId),
    computeNextLessonBrief(repo, studentId),
  ]);
  const certificateType =
    memberships.find((m) => m.organizationId === viewer.organization.id)?.certificateType ?? null;

  const progressions = computeSkillProgression(signals.filter((s) => !s.dismissed));
  const progression = progressions.find((p) => p.skill === (skillParam as TrainingSkill));
  if (!progression) return null;

  const skillSignals = signals
    .filter((s) => s.skill === progression.skill && !s.dismissed)
    .sort((a, b) => a.flightDate.localeCompare(b.flightDate));
  const latestSignal = skillSignals[skillSignals.length - 1]!;
  const latestInstructor = latestSignal.instructorId ? await repo.getInstructor(latestSignal.instructorId) : null;

  const trendPoints = skillSignals.slice(-6).map((s) => ({
    label: formatFlightDate(s.flightDate),
    score: 1,
    max: 1,
    state: s.status === "NEEDS_COACHING" ? ("Needs Work" as const) : ("Improving" as const),
  }));

  const acsArea = acsAreaForSkill(progression.skill, certificateType);
  const recurringTheme = brief.recurringThemes.find((t) => t.skill === progression.skill) ?? null;

  const trainHref =
    progression.skill === "RADIO_COMMUNICATIONS" && hrefs.radioPracticeHref
      ? hrefs.radioPracticeHref
      : hrefs.chairFlyHref && hasAuthoredScenario(skillLabel(progression.skill))
        ? hrefs.chairFlyHref
        : hrefs.trainHref;

  return {
    label: progression.label,
    score: meterScoreForSkillStatus(progression.status),
    max: 4,
    state: toneForSkillStatus(progression.status),
    infoTipText: (
      <>
        Four levels, from &ldquo;needs work&rdquo; to &ldquo;meets standard&rdquo;, for this one skill. It comes from
        what your instructor said about it &mdash; the sentence is right below. There&rsquo;s no overall score, and
        no readiness percentage: whether you&rsquo;re ready to solo is your instructor&rsquo;s call.
      </>
    ),
    acsArea: acsArea?.name ?? null,
    comparison: null,
    latestEvidence: { label: latestInstructor?.name ?? "Your instructor", text: latestSignal.statement },
    recurring:
      recurringTheme && recurringTheme.instructorCount >= 2
        ? { lessons: recurringTheme.count, instructors: recurringTheme.instructorCount }
        : null,
    trendPoints,
    vectorRead: null,
    trainHref,
  };
}
