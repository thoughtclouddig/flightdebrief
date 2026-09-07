import { AcsBadge } from "@/components/acs-badge";
import { PerceptionGapList } from "@/components/debrief/perception-gap-list";
import { RecurrenceTimeline } from "@/components/debrief/recurrence-timeline";
import { LocalDateTime } from "@/components/local-date-time";
import { SkillProgressList } from "@/components/skill-progress-list";
import type { CfiV2StudentDetail } from "@/lib/cfi-v2/student-detail";
import type { SchoolAttentionItem } from "@/lib/school-v2/overview";
import { formatFlightDate } from "@/lib/utils";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">{title}</h2>
      <div className="rounded-2xl border border-hairline bg-surface px-5 py-4">{children}</div>
    </section>
  );
}

function BulletList({ items, cap }: { items: string[]; cap: number }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1">
      {items.slice(0, cap).map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[14px] text-foreground">
          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand" />
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * School V2's Student Detail -- reuses the identical computeCfiV2StudentDetail
 * data CFI V2's own screen does (zero new data-fetching logic), but a
 * deliberately different, shorter hierarchy for a school administrator
 * rather than the CFI's own working screen: identity, then WHY this student
 * needs attention (only when they actually do), then next flight, a
 * condensed "current training" instead of separate Current Focus/Last
 * Flight cards, progress, and a collapsed-by-default history. No
 * Recommended Starting Point section -- that's CFI instructional guidance,
 * not school monitoring context. Strictly view-only throughout: no
 * scheduling forms, no editable training-item lists, no radio-practice
 * assignment, no student-notes editing, no "log a flight" action, and no
 * outbound links into /cfi-v2/**.
 */
export function SchoolV2StudentDetailScreen({
  detail,
  attentionItem,
}: {
  detail: CfiV2StudentDetail;
  /** This student's own row from schoolAttentionFromRoster, if the school flagged them -- the SAME logic and reasons Overview/Students use, not a re-derived one. Undefined for a student with nothing to flag. */
  attentionItem?: SchoolAttentionItem;
}) {
  const { student, brief } = detail;
  const result = detail.lastDebriefResult;

  const workingOn = [...brief.keepWorkingOn, ...brief.beforeFlightItems];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
      <header>
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">Student pilot</p>
        <h1 className="mt-1 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-foreground">{student.name}</h1>
        {brief.lastInstructor ? (
          <p className="mt-1 text-[14px] text-foreground-soft">Currently training with {brief.lastInstructor.name}</p>
        ) : null}
      </header>

      {attentionItem ? (
        <section>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-amber">Why this student needs attention</h2>
          {attentionItem.reason === "recurring_theme" && brief.recurringThemes[0] ? (
            <div className="flex flex-col gap-2">
              <RecurrenceTimeline theme={brief.recurringThemes[0]} />
              <div className="flex justify-end">
                <AcsBadge skill={brief.recurringThemes[0].skill} certificateType={detail.certificateType} />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber/40 bg-surface px-5 py-4">
              <p className="text-[15px] text-foreground">{attentionItem.detail}</p>
            </div>
          )}
        </section>
      ) : null}

      <SectionCard title="Next flight">
        <div className="flex flex-col gap-4">
          <div id="next-flight">
            <p className="mb-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">When</p>
            {brief.upcomingReservation ? (
              <>
                <p className="text-[15px] text-foreground">
                  <LocalDateTime
                    iso={brief.upcomingReservation.scheduledStart}
                    options={{ weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }}
                  />
                </p>
                {brief.upcomingReservationInstructor ? (
                  <p className="mt-0.5 text-[14px] text-foreground-soft">With {brief.upcomingReservationInstructor.name}</p>
                ) : null}
              </>
            ) : (
              <p className="text-[15px] text-foreground-faint">Nothing scheduled yet.</p>
            )}
          </div>

          {brief.focusAreas.length > 0 ? (
            <div className="border-t border-hairline pt-3">
              <p className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">
                From the last debrief with {detail.cfiFirstName}
              </p>
              <ol className="flex flex-col gap-1.5">
                {brief.focusAreas.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-[15px] text-foreground">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-on-brand">
                      {i + 1}
                    </span>
                    {f}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="Current training">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">Working on</p>
            {workingOn.length > 0 ? <BulletList items={workingOn} cap={3} /> : <p className="text-[14px] text-foreground-faint">Nothing yet.</p>}
          </div>
          <div className="border-t border-hairline pt-3">
            <p className="mb-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">Last flight</p>
            {brief.lastFlight ? (
              <>
                <p className="text-[14px] text-foreground-faint">
                  {formatFlightDate(brief.lastFlight.flightDate)}
                  {brief.lastFlight.aircraft ? ` · ${brief.lastFlight.aircraft.tailNumber}` : ""}
                </p>
                {result && result.needsWork.length > 0 ? <div className="mt-1.5"><BulletList items={result.needsWork} cap={2} /></div> : null}
              </>
            ) : (
              <p className="text-[14px] text-foreground-faint">No completed flights yet.</p>
            )}
          </div>
        </div>
      </SectionCard>

      <section>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">Progress</h2>
        <div className="rounded-2xl border border-hairline bg-surface px-5 py-4">
          <SkillProgressList progressions={detail.skillProgressions} certificateType={detail.certificateType} audience="school" />
        </div>
      </section>

      {detail.perceptionGaps.length > 0 ? (
        <section>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">Where they saw it differently</h2>
          <PerceptionGapList rows={detail.perceptionGaps} />
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">History</h2>
        {detail.timeline.length > 0 ? (
          <details className="group overflow-hidden rounded-2xl border border-hairline bg-surface px-5 py-4">
            <summary className="cursor-pointer text-[14px] font-semibold text-foreground-soft">
              {detail.timeline.length} debriefed flight{detail.timeline.length === 1 ? "" : "s"}
            </summary>
            <ol className="relative mt-4 flex flex-col gap-6 border-l border-hairline pl-6">
              {detail.timeline.map(({ flight, topics }) => (
                <li key={flight.id} className="relative">
                  <span className="absolute -left-[29px] top-1 flex size-3.5 items-center justify-center rounded-full border-2 border-surface bg-brand" />
                  <p className="text-[15px] font-semibold text-foreground">{formatFlightDate(flight.flightDate)}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {topics.map((topic, i) => (
                      <span key={i} className="rounded-md bg-surface-sunken px-2 py-0.5 text-[12px] font-medium text-foreground-soft">
                        {topic}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </details>
        ) : (
          <p className="text-[15px] text-foreground-faint">No debrief history yet.</p>
        )}
      </section>
    </div>
  );
}
