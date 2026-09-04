import { AlertCircle, Repeat, TrendingUp } from "lucide-react";
import { AcsBadge } from "@/components/acs-badge";
import { TrainingItemChecklist } from "@/components/training-item-checklist";
import { Section } from "@/components/student/ui";
import {
  StudentProgress,
  type ProgressAcsData,
  type ProgressAcsRow,
  type ProgressSkillRow,
} from "@/components/student/student-progress";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { computeSkillProgression, meterScoreForSkillStatus, toneForSkillStatus } from "@/lib/skill-progress";
import { computeSchoolFreeDebriefs, computeStudentFreeFlights } from "@/lib/entitlements";
import { hasActiveSubscription } from "@/lib/billing-gate";
import { acsAreaForSkill } from "@/lib/acs";
import { allTrainingSkills } from "@/lib/topics";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";

export const dynamic = "force-dynamic";

/**
 * Production data adapter for components/student/student-progress.tsx -- see
 * that file's doc comment for why the ACS tab is real but Area-granularity
 * only, not the prototype's full Area/Task/Skill hierarchy.
 *
 * "Action items" / "Themes" / the free-usage banner / stat tiles have no
 * prototype equivalent -- they're real, already-shipped production
 * capabilities (open training items, recurring cross-instructor themes,
 * billing-gate usage) with nothing to migrate FROM, so they ride along in
 * the shared component's `extra` slot rather than being deleted to match
 * the fixture's simpler screen.
 */
export default async function ProgressPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const solo = viewer.organization.kind === "individual";
  const studentId = viewer.user.id;

  const isSchoolOrg = viewer.organization.kind === "school";
  const [flights, trainingItems, brief, memberships, signals, billingScopedFlights] = await Promise.all([
    repo.listFlights({ studentId }),
    repo.listTrainingItems(),
    computeNextLessonBrief(repo, studentId),
    repo.listMembershipsForUser(studentId),
    repo.listTrainingSignals({ studentId }),
    isSchoolOrg ? repo.listFlights({ organizationId: viewer.organization.id }) : Promise.resolve(null),
  ]);
  const certificateType =
    memberships.find((m) => m.organizationId === viewer.organization.id)?.certificateType ?? null;

  if (!viewer.user.guideProgress?.progress) {
    void repo.markGuideStepViewed(viewer.user.id, "progress").catch(() => {});
  }

  const flightIds = new Set(flights.map((f) => f.id));
  const openItems = trainingItems.filter((t) => flightIds.has(t.flightId) && !t.done && t.visibility === "shared");
  const keepWorkingOn = openItems.filter((t) => t.category === "keep_working_on");
  const beforeFlight = openItems.filter((t) => t.category === "before_next_flight");
  const progressions = computeSkillProgression(signals.filter((s) => !s.dismissed));
  const freeUsage = isSchoolOrg
    ? computeSchoolFreeDebriefs(billingScopedFlights ?? [])
    : computeStudentFreeFlights(flights);
  const showFreeUsage = viewer.organization.kind !== "independent_cfi" && !hasActiveSubscription(viewer.organization);
  const instructorFirstName = resolveCfiFirstName(brief.lastInstructor) ?? "your instructor";

  const skills: ProgressSkillRow[] = progressions.map((p) => ({
    slug: p.skill,
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

  return (
    <StudentProgress
      title={solo ? "Your proficiency" : "Your progress"}
      skills={skills}
      skillHref={(slug) => `/progress/${slug}`}
      acs={acs}
      extra={
        <>
          <p className="-mt-4 px-1.5 text-[15px] leading-relaxed text-foreground-soft">
            Patterns across your training -- conservative on purpose. Nothing here is a trend until it&rsquo;s shown
            up more than once.
          </p>
          {showFreeUsage ? (
            <p className="-mt-2 px-1.5 text-[13px] font-semibold text-brand">
              {freeUsage.exhausted
                ? `You've used your ${freeUsage.cap} free ${isSchoolOrg ? "debriefs" : "flights"}.`
                : `${freeUsage.used} of ${freeUsage.cap} free ${isSchoolOrg ? "debriefs" : "flights"} used`}
            </p>
          ) : null}

          <Section title="Action items">
            {keepWorkingOn.length > 0 || beforeFlight.length > 0 ? (
              <div className="flex flex-col gap-4">
                {keepWorkingOn.length > 0 ? (
                  <div>
                    <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-foreground-faint">
                      <AlertCircle className="size-3.5" aria-hidden />
                      Ongoing ({keepWorkingOn.length})
                    </p>
                    <p className="mt-1 text-[15px] text-foreground-soft">
                      {solo
                        ? "Skills that came out of your own debriefs."
                        : "Skills your instructor called out across debriefs."}{" "}
                      These clear on their own once a later flight shows you&rsquo;ve got it -- or check one off
                      yourself if you feel ready.
                    </p>
                    <div className="mt-2">
                      <TrainingItemChecklist items={keepWorkingOn} />
                    </div>
                  </div>
                ) : null}
                {beforeFlight.length > 0 ? (
                  <div>
                    <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-foreground-faint">
                      Before your next flight ({beforeFlight.length})
                    </p>
                    <div className="mt-2">
                      <TrainingItemChecklist items={beforeFlight} />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="py-6 text-center text-[15px] text-foreground-faint">Nothing open right now.</p>
            )}
          </Section>

          <Section title="Themes">
            {brief.focusAreas.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {brief.focusAreas.map((f, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-surface-sunken px-2.5 py-1 text-[13px] font-semibold text-foreground-soft"
                  >
                    {f}
                  </span>
                ))}
              </div>
            ) : null}

            {brief.recurringThemes.length > 0 ? (
              <div className="mt-4 flex flex-col gap-3">
                {brief.recurringThemes.map((theme, i) => (
                  <div key={i} className="rounded-xl border border-state-attention/30 bg-surface-sunken px-4 py-3.5">
                    <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-state-attention">
                      <Repeat className="size-3.5" aria-hidden />
                      Recurring
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-foreground-soft">
                      <span className="font-semibold text-foreground">{theme.theme}</span> has come up in{" "}
                      {theme.count} {theme.count === 1 ? "lesson" : "lessons"}
                      {theme.instructorCount >= 2 ? ` with ${theme.instructorCount} instructors` : ""}.
                      <AcsBadge skill={theme.skill} certificateType={certificateType} />
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 flex items-center gap-3 py-2 text-[15px] text-foreground-faint">
                <TrendingUp className="size-5 shrink-0" aria-hidden />
                Not enough debriefs yet to spot a recurring theme -- keep flying.
              </p>
            )}
          </Section>
        </>
      }
    />
  );
}
