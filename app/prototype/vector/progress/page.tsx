import {
  StudentProgress,
  type ProgressAcsData,
  type ProgressSkillRow,
} from "@/components/student/student-progress";
import { INSTRUCTOR, SKILL_SCORES } from "@/lib/prototype-fixtures/vector-data";
import { acsReadiness } from "@/lib/prototype/acs";

/** Fixture data adapter for components/student/student-progress.tsx -- see that file's doc comment for the shared hierarchy and the real Skills/ACS granularity split. */
export default function ProgressPage() {
  const skills: ProgressSkillRow[] = SKILL_SCORES.map((s) => ({
    slug: s.slug,
    label: s.skill,
    score: s.score,
    max: s.max,
    state: s.state,
  }));

  const readiness = acsReadiness();
  const acs: ProgressAcsData = {
    meetingStandard: readiness.meetingStandard,
    assessed: readiness.assessed,
    notAssessed: readiness.notAssessed,
    total: readiness.total,
    unitLabel: "tasks",
    readinessInfoTip: (
      <span className="flex flex-col gap-2.5">
        <span>
          A task counts as <strong className="font-semibold text-foreground">assessed</strong> once{" "}
          {INSTRUCTOR.firstName} has rated a skill under it. Most tasks here haven&rsquo;t come up in a lesson yet.
        </span>
        <span>
          A task sits at its <strong className="font-semibold text-foreground">weakest assessed skill</strong> — it
          isn&rsquo;t at standard while part of it isn&rsquo;t.
        </span>
        <span>
          There is no percentage and no overall verdict. Signing you off for a checkride is {INSTRUCTOR.firstName}
          &rsquo;s call.
        </span>
      </span>
    ),
    areas: readiness.areas.map((group) => ({
      area: group.area,
      rows: group.tasks.map((t) => ({
        label: t.task.name,
        code: t.task.code,
        skills: t.skills.map((s) => ({ slug: s.slug, label: s.skill })),
        state: t.state,
        score: t.score,
        max: t.max,
      })),
    })),
  };

  return (
    <StudentProgress
      skills={skills}
      skillHref={(slug) => `/prototype/vector/progress/${slug}`}
      acs={acs}
    />
  );
}
