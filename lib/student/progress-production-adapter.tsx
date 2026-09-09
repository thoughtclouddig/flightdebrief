import type {
  ProgressAcsData,
  ProgressAcsRow,
  ProgressSkillRow,
} from "@/components/student/student-progress";
import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";
import { computeSkillProgression, meterScoreForSkillStatus, toneForSkillStatus } from "@/lib/skill-progress";
import { acsAreaForSkill } from "@/lib/acs";
import { allTrainingSkills } from "@/lib/topics";
import { instructorAttributionLabel } from "@/lib/instructor-attribution";
import { computeNextLessonBrief } from "@/lib/training-memory";

export interface ProductionProgressProps {
  skills: ProgressSkillRow[];
  acs: ProgressAcsData;
}

/**
 * Real Skills/ACS -- feeds components/student/student-progress.tsx (the
 * approved V2 presentation) from real training signals. Extracted from the
 * skills/ACS portion of app/(product)/progress/page.tsx's own prior inline
 * logic (no behavior change to that computation), shared with
 * app/v2/progress/page.tsx's own real-data branch.
 *
 * Deliberately returns only {skills, acs} -- canonical Progress's Action
 * items/Themes/free-usage banner stay exactly where they were (real,
 * already-shipped capabilities with no approved V2 presentation of their
 * own), computed independently in that page, not part of this shared
 * extraction.
 *
 * ACS is real but Area-granularity only, not the fixture's full Area/Task/
 * Skill hierarchy -- see components/student/student-progress.tsx's own doc
 * comment.
 */
export async function buildProductionProgressProps(
  repo: Repository,
  viewer: Viewer,
  skillHref: (skill: string) => string,
): Promise<ProductionProgressProps> {
  const studentId = viewer.user.id;

  const [memberships, signals] = await Promise.all([
    repo.listMembershipsForUser(studentId),
    repo.listTrainingSignals({ studentId }),
  ]);
  const certificateType =
    memberships.find((m) => m.organizationId === viewer.organization.id)?.certificateType ?? null;

  const brief = await computeNextLessonBrief(repo, studentId);
  const progressions = computeSkillProgression(signals.filter((s) => !s.dismissed));
  // Null (a genuinely solo last flight) must read as self-assessment, never
  // "your instructor has rated it" -- see lib/instructor-attribution.ts.
  const cfi = instructorAttributionLabel(brief.lastInstructor);

  const skills: ProgressSkillRow[] = progressions.map((p) => ({
    slug: p.skill,
    href: skillHref(p.skill),
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
          {cfi ? `${cfi} has` : "you've"} rated it in a debrief. Most skills here haven&rsquo;t come up in a lesson
          yet.
        </span>
        <span>
          There is no percentage and no overall verdict.{" "}
          {cfi ? `Signing you off for a checkride is ${cfi}'s call.` : "Checkride sign-off isn't decided here."}
        </span>
      </span>
    ),
  };

  return { skills, acs };
}
