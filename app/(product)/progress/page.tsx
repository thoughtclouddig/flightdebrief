import { Repeat, TrendingUp } from "lucide-react";
import { AcsBadge } from "@/components/acs-badge";
import { Section } from "@/components/student/ui";
import { StudentProgress } from "@/components/student/student-progress";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { computeNextLessonBrief } from "@/lib/training-memory";
import { buildProductionProgressProps } from "@/lib/student/progress-production-adapter";

export const dynamic = "force-dynamic";

/**
 * Production data adapter for components/student/student-progress.tsx -- see
 * that file's doc comment for why the ACS tab is real but Area-granularity
 * only, not the prototype's full Area/Task/Skill hierarchy. Skills/ACS
 * computation itself lives in lib/student/progress-production-adapter.ts,
 * shared verbatim with app/v2/progress/page.tsx's own real-data branch.
 *
 * Progress answers "how am I progressing" -- proficiency evidence only, not
 * task management (Action Items) and not account/billing status (the
 * free-usage line). Both used to ride along here in the shared component's
 * `extra` slot; removed by explicit product decision, not merely relocated
 * to preserve their code -- the underlying data (repo.listTrainingItems(),
 * lib/entitlements.ts, lib/billing-gate.ts) is untouched and still backs
 * Train's own action-item display and the real /billing page respectively.
 *
 * Themes stays, but only the genuinely-recurring half of it: brief.
 * focusAreas (lib/training-memory.ts) is just the most recent debrief's own
 * focus list, not recurrence-tested, and rendering it as a chip alongside
 * brief.recurringThemes' honest "not enough debriefs yet" empty state read
 * as a direct contradiction -- a theme-shaped label sitting right next to
 * text saying there wasn't enough evidence for one. recurringThemes' own
 * threshold (computeRecurringThemes: >=2 considered flights, the same
 * skill flagged NEEDS_COACHING across >=2 distinct flights) is real
 * evidence, so that half stays as the section's only source of truth.
 */
export default async function ProgressPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const solo = viewer.organization.kind === "individual";
  const studentId = viewer.user.id;

  const [{ skills, acs }, brief] = await Promise.all([
    buildProductionProgressProps(repo, viewer, (skill) => `/progress/${skill}`),
    computeNextLessonBrief(repo, studentId),
  ]);

  if (!viewer.user.guideProgress?.progress) {
    void repo.markGuideStepViewed(viewer.user.id, "progress").catch(() => {});
  }

  const certificateType = (await repo.listMembershipsForUser(studentId)).find(
    (m) => m.organizationId === viewer.organization.id,
  )?.certificateType ?? null;

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

          <Section title="Themes">
            {brief.recurringThemes.length > 0 ? (
              <div className="flex flex-col gap-3">
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
              <p className="flex items-center gap-3 py-2 text-[15px] text-foreground-faint">
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
