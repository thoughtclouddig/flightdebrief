import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  AcsBadge,
  BackLink,
  Evidence,
  InfoTip,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Section,
  SkillMeter,
  StateLabel,
  TrendStrip,
} from "@/components/student/ui";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeSkillProgression, meterScoreForSkillStatus, toneForSkillStatus } from "@/lib/skill-progress";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { acsAreaForSkill } from "@/lib/acs";
import { formatFlightDate } from "@/lib/utils";
import type { TrainingSkill } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Per-skill drill-down -- app/prototype/vector/progress/[skill]/page.tsx is
 * the design source, and it turned out to be truthfully buildable: every
 * field it needs (a score, a dated trend, a real quoted statement, ACS
 * attribution, a real cross-instructor recurring count) already exists on
 * production's TrainingSignal rows (lib/types.ts), computeSkillProgression's
 * history (lib/skill-progress.ts), and computeNextLessonBrief's
 * recurringThemes (lib/training-memory.ts) -- nothing here is fixture-
 * backed. "Vector's read" is the one prototype section genuinely omitted:
 * there is no real per-student Vector context builder yet (see the
 * migration roadmap), so nothing renders there rather than fabricating one.
 * Same for the prototype's "How you both saw it" -- production computes a
 * perception gap per FLIGHT (lib/perception-gap.ts, on the debrief itself),
 * not aggregated per skill across flights, so there's no real per-skill
 * comparison to show without inventing an aggregation that doesn't exist.
 */
export default async function SkillDetailPage({ params }: { params: Promise<{ skill: string }> }) {
  const { skill: skillParam } = await params;
  const repo = getRepository();
  const viewer = await getViewer();
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
  if (!progression) notFound();

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

  const tone = toneForSkillStatus(progression.status);
  const acsArea = acsAreaForSkill(progression.skill, certificateType);
  const recurringTheme = brief.recurringThemes.find((t) => t.skill === progression.skill) ?? null;

  return (
    <Screen>
      <BackLink href="/progress">Progress</BackLink>

      <div>
        <h1 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">{progression.label}</h1>
        <div className="mt-4 flex items-center gap-3">
          <SkillMeter score={meterScoreForSkillStatus(progression.status)} max={4} state={tone} size="lg" />
          <StateLabel state={tone} />
          <InfoTip label="What this means" align="left">
            Four levels, from &ldquo;needs work&rdquo; to &ldquo;meets standard&rdquo;, for this one skill. It comes
            from what your instructor said about it &mdash; the sentence is right below. There&rsquo;s no overall
            score, and no readiness percentage: whether you&rsquo;re ready to solo is your instructor&rsquo;s call.
          </InfoTip>
        </div>
        {acsArea ? (
          <div className="mt-3">
            <AcsBadge area={acsArea.name} />
          </div>
        ) : null}
      </div>

      <Section title="Latest evidence">
        <div className="flex flex-col gap-6">
          <Evidence label={latestInstructor?.name ?? "Your instructor"} tone="instructor" text={latestSignal.statement} />
        </div>
      </Section>

      {recurringTheme && recurringTheme.instructorCount >= 2 ? (
        <Section title="Still showing up">
          <p className="text-[17px] leading-snug text-foreground">
            {recurringTheme.count} recent lessons · {recurringTheme.instructorCount} instructors
          </p>
        </Section>
      ) : null}

      <Section title="Trend">
        <TrendStrip points={trendPoints} />
      </Section>

      <div className="flex flex-col gap-2.5">
        <PrimaryButton href="/train">
          Train this with Vector
          <ArrowRight className="size-[18px]" aria-hidden />
        </PrimaryButton>
        <SecondaryButton href="/debrief">View lesson history</SecondaryButton>
      </div>
    </Screen>
  );
}
