import { redirect } from "next/navigation";
import {
  StudentProgress,
  type ProgressAcsData,
  type ProgressSkillRow,
} from "@/components/student/student-progress";
import { INSTRUCTOR, SKILL_SCORES } from "@/lib/prototype-fixtures/vector-data";
import { acsReadiness } from "@/lib/prototype/acs";
import { v2RealDataMode } from "@/lib/env";
import { hasV2RealDataCookie } from "@/lib/auth/session";
import { getViewer } from "@/lib/viewer";
import { getRepository } from "@/lib/data";
import { buildProductionProgressProps } from "@/lib/student/progress-production-adapter";

/**
 * Milestone 1A fixture-parity Progress -- mechanically the same as
 * app/prototype/vector/progress/page.tsx, hrefs repointed at /v2/**.
 *
 * Development real-data milestone: same adapter app/(product)/progress/
 * page.tsx uses. Per-skill hrefs still point at the canonical
 * /progress/[skill] -- Skill Detail has no /v2 route yet (out of scope for
 * this milestone's "wire these first" list); a disclosed, temporary
 * cross-tree link, not a fixture leak (SkillDetailScreen is already the
 * approved V2 presentation there, just reached via a canonical URL for now).
 */
export default async function V2Progress() {
  if (v2RealDataMode(await hasV2RealDataCookie())) {
    let viewer;
    try {
      viewer = await getViewer();
    } catch {
      redirect("/login?from=%2Fv2%2Fprogress&reason=no-session");
    }
    const props = await buildProductionProgressProps(getRepository(), viewer, (skill) => `/v2/progress/${skill}`);
    return <StudentProgress {...props} />;
  }

  const skills: ProgressSkillRow[] = SKILL_SCORES.map((s) => ({
    slug: s.slug,
    href: `/v2/progress/${s.slug}`,
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
        skills: t.skills.map((s) => ({ href: `/v2/progress/${s.slug}`, label: s.skill })),
        state: t.state,
        score: t.score,
        max: t.max,
      })),
    })),
  };

  return <StudentProgress skills={skills} acs={acs} />;
}
