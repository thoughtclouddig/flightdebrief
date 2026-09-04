import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SkillDetailScreen } from "@/components/student/progress/skill-detail";
import { objectiveForSkill } from "@/lib/prototype/assessment";
import { INSTRUCTOR, SKILL_SCORES, skillBySlug } from "@/lib/prototype-fixtures/vector-data";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return SKILL_SCORES.map((s) => ({ skill: s.slug }));
}

/** Fixture data adapter for components/student/progress/skill-detail.tsx -- see that file's doc comment for the shared hierarchy. */
export default async function SkillDetail({ params }: { params: Promise<{ skill: string }> }) {
  const { skill: slug } = await params;
  const skill = skillBySlug(slug);
  if (!skill) notFound();
  const gap = objectiveForSkill(skill.skill);

  return (
    <SkillDetailScreen
      backHref="/prototype/vector/progress"
      label={skill.skill}
      score={skill.score}
      max={skill.max}
      state={skill.state}
      infoTipText={
        <>
          Four levels, from &ldquo;needs work&rdquo; to &ldquo;meets standard&rdquo;, for this one skill. It comes
          from what {INSTRUCTOR.firstName} said about it &mdash; the sentence is right below. There&rsquo;s no
          overall score, and no readiness percentage: whether you&rsquo;re ready to solo is your instructor&rsquo;s
          call.
        </>
      }
      acsArea={skill.acsArea}
      comparison={gap ? { task: gap.task, student: gap.studentLevel, instructor: gap.instructorLevel, instructorName: INSTRUCTOR.firstName } : null}
      latestEvidence={{ label: INSTRUCTOR.firstName, text: skill.instructorEvidence }}
      recurring={skill.recurring ? { lessons: skill.recurring.lessons, instructors: skill.recurring.instructors } : null}
      trendPoints={skill.trend.map((t) => ({ ...t, max: skill.max }))}
      vectorRead={skill.vectorRead}
      trainHref="/prototype/vector/train"
      lessonHistoryHref="/prototype/vector/debrief"
    />
  );
}
