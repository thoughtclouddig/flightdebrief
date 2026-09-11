import { AlertCircle, Repeat, TrendingUp } from "lucide-react";
import { AcsBadge } from "@/components/acs-badge";
import { TrainingItemChecklist } from "@/components/training-item-checklist";
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
 * "Action items" / "Themes" / the free-usage banner / stat tiles have no
 * prototype equivalent -- they're real, already-shipped production
 * capabilities (open training items, recurring cross-instructor themes,
 * billing-gate usage) with nothing to migrate FROM, so they ride along in
 * the shared component's `extra` slot rather than being deleted to match
 * the fixture's simpler screen. Computed here, independently of the shared
 * adapter, since none of it is part of the approved V2 Skills/ACS view.
 */
export default async function ProgressPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const solo = viewer.organization.kind === "individual";
  const studentId = viewer.user.id;

  const isSchoolOrg = viewer.organization.kind === "school";
  const [{ skills, acs }, flights, trainingItems, brief, billingScopedFlights] = await Promise.all([
    buildProductionProgressProps(repo, viewer, (skill) => `/progress/${skill}`),
    repo.listFlights({ studentId }),
    repo.listTrainingItems(),
    computeNextLessonBrief(repo, studentId),
    isSchoolOrg ? repo.listFlights({ organizationId: viewer.organization.id }) : Promise.resolve(null),
  ]);

  if (!viewer.user.guideProgress?.progress) {
    void repo.markGuideStepViewed(viewer.user.id, "progress").catch(() => {});
  }

  const certificateType = (await repo.listMembershipsForUser(studentId)).find(
    (m) => m.organizationId === viewer.organization.id,
  )?.certificateType ?? null;
  const flightIds = new Set(flights.map((f) => f.id));
  const openItems = trainingItems.filter((t) => flightIds.has(t.flightId) && !t.done && t.visibility === "shared");
  const keepWorkingOn = openItems.filter((t) => t.category === "keep_working_on");
  const beforeFlight = openItems.filter((t) => t.category === "before_next_flight");
  const freeUsage = isSchoolOrg
    ? computeSchoolFreeDebriefs(billingScopedFlights ?? [])
    : computeStudentFreeFlights(flights);
  const showFreeUsage =
    viewer.organization.kind !== "independent_cfi" &&
    viewer.organization.kind !== "school" &&
    !hasActiveSubscription(viewer.organization);

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
