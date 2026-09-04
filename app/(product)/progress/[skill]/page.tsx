import { notFound } from "next/navigation";
import { SkillDetailScreen } from "@/components/student/progress/skill-detail";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeSkillProgression, meterScoreForSkillStatus, toneForSkillStatus } from "@/lib/skill-progress";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { acsAreaForSkill } from "@/lib/acs";
import { formatFlightDate } from "@/lib/utils";
import type { TrainingSkill } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Production data adapter for components/student/progress/skill-detail.tsx
 * -- every field it needs (a score, a dated trend, a real quoted statement,
 * ACS attribution, a real cross-instructor recurring count) already exists
 * on TrainingSignal rows and computeNextLessonBrief's recurringThemes;
 * nothing here is fixture-backed. "Vector's read" and "How you both saw it"
 * are passed null -- see the shared component's own doc comment for why
 * those two are real capability gaps, not omissions of convenience.
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

  const acsArea = acsAreaForSkill(progression.skill, certificateType);
  const recurringTheme = brief.recurringThemes.find((t) => t.skill === progression.skill) ?? null;

  return (
    <SkillDetailScreen
      backHref="/progress"
      label={progression.label}
      score={meterScoreForSkillStatus(progression.status)}
      max={4}
      state={toneForSkillStatus(progression.status)}
      infoTipText={
        <>
          Four levels, from &ldquo;needs work&rdquo; to &ldquo;meets standard&rdquo;, for this one skill. It comes
          from what your instructor said about it &mdash; the sentence is right below. There&rsquo;s no overall
          score, and no readiness percentage: whether you&rsquo;re ready to solo is your instructor&rsquo;s call.
        </>
      }
      acsArea={acsArea?.name ?? null}
      comparison={null}
      latestEvidence={{ label: latestInstructor?.name ?? "Your instructor", text: latestSignal.statement }}
      recurring={recurringTheme && recurringTheme.instructorCount >= 2 ? { lessons: recurringTheme.count, instructors: recurringTheme.instructorCount } : null}
      trendPoints={trendPoints}
      vectorRead={null}
      trainHref="/train"
      lessonHistoryHref="/debrief"
    />
  );
}
