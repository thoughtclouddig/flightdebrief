import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SkillDetailScreen } from "@/components/student/progress/skill-detail";
import { objectiveForSkill } from "@/lib/prototype/assessment";
import { INSTRUCTOR, SKILL_SCORES, skillBySlug } from "@/lib/prototype-fixtures/vector-data";
import { buildFixtureStudentHrefs } from "@/lib/prototype-fixtures/fixture-student-hrefs";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return SKILL_SCORES.map((s) => ({ skill: s.slug }));
}

const HREFS = buildFixtureStudentHrefs("/demo/student");

/** Public Student demo's Skill Detail -- the same SkillDetailScreen component and fixture data app/v2/progress/[skill]/page.tsx's fixture branch renders, hrefs built from /demo/student instead of /v2. */
export default async function DemoStudentSkillDetail({ params }: { params: Promise<{ skill: string }> }) {
  const { skill: slug } = await params;
  const skill = skillBySlug(slug);
  if (!skill) notFound();
  const gap = objectiveForSkill(skill.skill);

  return (
    <SkillDetailScreen
      backHref={HREFS.progress}
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
      trainHref={HREFS.train}
      lessonHistoryHref={HREFS.debriefHub}
    />
  );
}
