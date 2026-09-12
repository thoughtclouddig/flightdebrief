import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SkillDetailScreen } from "@/components/student/progress/skill-detail";
import { objectiveForSkill } from "@/lib/prototype/assessment";
import { INSTRUCTOR, SKILL_SCORES, skillBySlug } from "@/lib/prototype-fixtures/vector-data";
import { v2RealDataMode } from "@/lib/env";
import { hasV2RealDataCookie } from "@/lib/auth/session";
import { getViewer } from "@/lib/viewer";
import { getRepository } from "@/lib/data";
import { buildProductionSkillDetailProps } from "@/lib/student/skill-detail-production-adapter";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return SKILL_SCORES.map((s) => ({ skill: s.slug }));
}

/**
 * Milestone 1A fixture-parity Skill Detail -- mechanically the same as app/prototype/vector/progress/[skill]/page.tsx, hrefs repointed at /v2/**.
 *
 * Real-data branch: same adapter app/(product)/progress/[skill]/page.tsx
 * uses, hrefs repointed at /v2/**. Closes the D-classified gap from the
 * routing audit -- Progress's skill rows and Train's "still working on"
 * rows now stay under /v2 for this route too.
 */
export default async function V2SkillDetail({ params }: { params: Promise<{ skill: string }> }) {
  const { skill: slug } = await params;

  if (v2RealDataMode(await hasV2RealDataCookie())) {
    let viewer;
    try {
      viewer = await getViewer();
    } catch {
      redirect(`/login?from=%2Fv2%2Fprogress%2F${slug}&reason=no-session`);
    }
    const props = await buildProductionSkillDetailProps(getRepository(), viewer, slug, { trainHref: "/v2/train" });
    if (!props) notFound();
    return <SkillDetailScreen {...props} backHref="/v2/progress" lessonHistoryHref="/v2/debrief" />;
  }

  const skill = skillBySlug(slug);
  if (!skill) notFound();
  const gap = objectiveForSkill(skill.skill);

  return (
    <SkillDetailScreen
      backHref="/v2/progress"
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
      trainHref="/v2/train"
      lessonHistoryHref="/v2/debrief"
    />
  );
}
