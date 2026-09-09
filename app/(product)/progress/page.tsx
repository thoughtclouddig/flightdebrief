import { Repeat, TrendingUp } from "lucide-react";
import { AcsBadge } from "@/components/acs-badge";
import { Section } from "@/components/student/ui";
import { StudentProgress } from "@/components/student/student-progress";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { computeSchoolFreeDebriefs, computeStudentFreeFlights } from "@/lib/entitlements";
import { hasActiveSubscription } from "@/lib/billing-gate";
import { buildProductionProgressProps } from "@/lib/student/progress-production-adapter";

export const dynamic = "force-dynamic";

/**
 * Production data adapter for components/student/student-progress.tsx -- see
 * that file's doc comment for why the ACS tab is real but Area-granularity
 * only, not the prototype's full Area/Task/Skill hierarchy. Skills/ACS
 * computation itself lives in lib/student/progress-production-adapter.ts,
 * shared verbatim with app/v2/progress/page.tsx's own real-data branch.
 *
 * "Themes" / the free-usage banner have no prototype equivalent -- they're
 * real, already-shipped production capabilities (recurring cross-instructor
 * themes, billing-gate usage) with nothing to migrate FROM, so they ride
 * along in the shared component's `extra` slot rather than being deleted to
 * match the fixture's simpler screen. Computed here, independently of the
 * shared adapter, since none of it is part of the approved V2 Skills/ACS
 * view.
 *
 * Action Items deliberately does NOT live here. It was carried over
 * verbatim from the pre-V2 production Progress page during the V2 cutover
 * (see git history around the V2 progress migration) rather than being
 * designed for this screen -- Progress answers "what am I getting better
 * at, and how close am I to proficiency," and open training items belong
 * to Next Flight ("what should I focus on before my next lesson") and
 * Train, both of which already surface them. Rendering the same open
 * items a third time here duplicated Next Flight's "Before you fly"
 * checklist verbatim and pushed Skills/ACS below the fold.
 */
export default async function ProgressPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const solo = viewer.organization.kind === "individual";
  const studentId = viewer.user.id;

  const isSchoolOrg = viewer.organization.kind === "school";
  const [{ skills, acs }, flights, brief, billingScopedFlights] = await Promise.all([
    buildProductionProgressProps(repo, viewer, (skill) => `/progress/${skill}`),
    repo.listFlights({ studentId }),
    computeNextLessonBrief(repo, studentId),
    isSchoolOrg ? repo.listFlights({ organizationId: viewer.organization.id }) : Promise.resolve(null),
  ]);

  if (!viewer.user.guideProgress?.progress) {
    void repo.markGuideStepViewed(viewer.user.id, "progress").catch(() => {});
  }

  const certificateType = (await repo.listMembershipsForUser(studentId)).find(
    (m) => m.organizationId === viewer.organization.id,
  )?.certificateType ?? null;
  const freeUsage = isSchoolOrg
    ? computeSchoolFreeDebriefs(billingScopedFlights ?? [])
    : computeStudentFreeFlights(flights);
  const showFreeUsage = viewer.organization.kind !== "independent_cfi" && !hasActiveSubscription(viewer.organization);

  return (
    <StudentProgress
      title={solo ? "Your proficiency" : "Your progress"}
      skills={skills}
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
