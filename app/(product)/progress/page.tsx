import {
  StudentProgress,
  type ProgressAcsData,
  type ProgressAcsRow,
  type ProgressSkillRow,
} from "@/components/student/student-progress";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeSkillProgression, meterScoreForSkillStatus, toneForSkillStatus } from "@/lib/skill-progress";
import { acsAreaForSkill } from "@/lib/acs";
import { allTrainingSkills } from "@/lib/topics";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { computeNextLessonBrief } from "@/lib/training-memory";

export const dynamic = "force-dynamic";

/**
 * Production data adapter for components/student/student-progress.tsx -- see
 * that file's doc comment for why the ACS tab is real but Area-granularity
 * only, not the prototype's full Area/Task/Skill hierarchy.
 *
 * Action items, Themes, the free-usage banner, and the "Your progress" vs
 * "Your proficiency" title split all used to ride along in this page's
 * `extra` slot -- real, pre-existing production content, but never part of
 * the approved V2 Skills/ACS presentation, and rendered above it every time.
 * That made this screen open into a materially different experience than
 * `/v2/progress`, confirmed live in the Development Repl. None of that
 * intelligence is gone: Themes was already duplicated by Train's own
 * `recommended` card (same `brief.recurringThemes` data) and simply isn't
 * repeated here anymore; "before your next flight" items now merge into
 * Home's `nextFlight.focusItems`; "ongoing" items now surface on Train under
 * their own labeled section; the free-usage notice now lives on Profile,
 * next to the rest of account/billing status. Progress opens directly into
 * the approved Skills/ACS view, matching `/v2/progress` exactly.
 */
export default async function ProgressPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const studentId = viewer.user.id;

  const [brief, memberships, signals] = await Promise.all([
    computeNextLessonBrief(repo, studentId),
    repo.listMembershipsForUser(studentId),
    repo.listTrainingSignals({ studentId }),
  ]);
  const certificateType =
    memberships.find((m) => m.organizationId === viewer.organization.id)?.certificateType ?? null;

  if (!viewer.user.guideProgress?.progress) {
    void repo.markGuideStepViewed(viewer.user.id, "progress").catch(() => {});
  }

  const progressions = computeSkillProgression(signals.filter((s) => !s.dismissed));
  const instructorFirstName = resolveCfiFirstName(brief.lastInstructor) ?? "your instructor";

  const skills: ProgressSkillRow[] = progressions.map((p) => ({
    slug: p.skill,
    href: `/progress/${p.skill}`,
    label: p.label,
    score: meterScoreForSkillStatus(p.status),
    max: 4,
    state: toneForSkillStatus(p.status),
  }));

  const progressionBySkill = new Map(progressions.map((p) => [p.skill, p]));
  const areaMap = new Map<string, ProgressAcsRow[]>();
  for (const s of allTrainingSkills()) {
    const area = acsAreaForSkill(s.skill, certificateType);
    if (!area) continue;
    const p = progressionBySkill.get(s.skill);
    const rows = areaMap.get(area.name) ?? [];
    rows.push(
      p
        ? {
            label: p.label,
            code: null,
            skills: [],
            state: toneForSkillStatus(p.status),
            score: meterScoreForSkillStatus(p.status),
            max: 4,
          }
        : { label: s.label, code: null, skills: [], state: null, score: null, max: 4 },
    );
    areaMap.set(area.name, rows);
  }
  const areas = [...areaMap.entries()].map(([area, rows]) => ({ area, rows }));
  const allRows = areas.flatMap((g) => g.rows);
  const assessedRows = allRows.filter((r) => r.state !== null);

  const acs: ProgressAcsData = {
    meetingStandard: assessedRows.filter((r) => r.state === "Meets Standard").length,
    assessed: assessedRows.length,
    notAssessed: allRows.length - assessedRows.length,
    total: allRows.length,
    unitLabel: "skills",
    areas,
    readinessInfoTip: (
      <span className="flex flex-col gap-2.5">
        <span>
          A skill counts as <strong className="font-semibold text-panel-foreground">assessed</strong> once{" "}
          {instructorFirstName} has rated it in a debrief. Most skills here haven&rsquo;t come up in a lesson yet.
        </span>
        <span>
          There is no percentage and no overall verdict. Signing you off for a checkride is {instructorFirstName}
          &rsquo;s call.
        </span>
      </span>
    ),
  };

  return <StudentProgress skills={skills} acs={acs} />;
}
