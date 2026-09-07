import { AcsBadge } from "@/components/acs-badge";
import { PerceptionGapList } from "@/components/debrief/perception-gap-list";
import { RecurrenceTimeline } from "@/components/debrief/recurrence-timeline";
import { LocalDateTime } from "@/components/local-date-time";
import { SkillProgressList } from "@/components/skill-progress-list";
import type { CfiV2StudentDetail } from "@/lib/cfi-v2/student-detail";
import { formatFlightDate } from "@/lib/utils";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">{title}</h2>
      <div className="rounded-2xl border border-hairline bg-surface px-5 py-4">{children}</div>
    </section>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">{title}</p>
      <ul className="flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[14px] text-foreground-soft">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * School V2's Student Detail -- the same core hierarchy as CFI V2's (Next
 * Flight, Current Focus, Last Flight, Progress, Perception, History), built
 * from the identical computeCfiV2StudentDetail data, but strictly view-only:
 * no scheduling forms, no editable training-item lists, no radio-practice
 * assignment, no student-notes editing, no "log a flight" action, and no
 * outbound links into /cfi-v2/** (School V2 stays inside /school-v2/**).
 * This is a monitoring/drill-down surface, not another student-control one.
 */
export function SchoolV2StudentDetailScreen({ detail }: { detail: CfiV2StudentDetail }) {
  const { student, brief } = detail;
  const result = detail.lastDebriefResult;
  const firstName = student.name.split(" ")[0];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
      <header>
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">Student pilot</p>
        <h1 className="mt-1 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-foreground">{student.name}</h1>
        {brief.lastInstructor ? (
          <p className="mt-1 text-[14px] text-foreground-soft">Currently training with {brief.lastInstructor.name}</p>
        ) : null}
      </header>

      <SectionCard title="Next flight">
        <div className="flex flex-col gap-4">
          <div>
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

      <SectionCard title="Current focus">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">In the air</p>
            {brief.keepWorkingOn.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {brief.keepWorkingOn.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px] text-foreground">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-foreground-faint">Nothing yet.</p>
            )}
          </div>
          {brief.beforeFlightItems.length > 0 ? (
            <div className="border-t border-hairline pt-3">
              <p className="mb-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">On the ground</p>
              <ul className="flex flex-col gap-1">
                {brief.beforeFlightItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px] text-foreground">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="Last flight">
        {brief.lastFlight ? (
          <div className="flex flex-col gap-4">
            <p className="text-[14px] text-foreground-faint">
              {formatFlightDate(brief.lastFlight.flightDate)}
              {brief.lastFlight.aircraft ? ` · ${brief.lastFlight.aircraft.tailNumber}` : ""}
            </p>
            {result ? (
              <>
                <MiniList title="Went well" items={result.wentWell.slice(0, 3)} />
                <MiniList title="Needs work" items={result.needsWork.slice(0, 3)} />
                {result.instructorGuidance[0] ? (
                  <blockquote className="rounded-lg bg-surface-sunken px-3 py-2 text-[14px] italic text-foreground-soft">
                    &ldquo;{result.instructorGuidance[0].quote}&rdquo;
                  </blockquote>
                ) : null}
              </>
            ) : null}
          </div>
        ) : (
          <p className="text-[15px] text-foreground-faint">No completed flights yet.</p>
        )}
      </SectionCard>

      <section>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">Progress</h2>
        <div className="rounded-2xl border border-hairline bg-surface px-5 py-4">
          <SkillProgressList progressions={detail.skillProgressions} certificateType={detail.certificateType} />
        </div>
      </section>

      {detail.perceptionGaps.length > 0 ? (
        <section>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">Where they saw it differently</h2>
          <PerceptionGapList rows={detail.perceptionGaps} />
        </section>
      ) : null}

      {brief.recurringThemes[0] ? (
        <div className="flex flex-col gap-2">
          <RecurrenceTimeline theme={brief.recurringThemes[0]} />
          <div className="flex justify-end">
            <AcsBadge skill={brief.recurringThemes[0].skill} certificateType={detail.certificateType} />
          </div>
        </div>
      ) : null}

      {detail.startingPoint ? (
        <SectionCard title="Recommended starting point">
          <p className="text-[15px] text-foreground">{detail.startingPoint}</p>
        </SectionCard>
      ) : null}

      <SectionCard title="History">
        {detail.timeline.length > 0 ? (
          <ol className="relative flex flex-col gap-6 border-l border-hairline pl-6">
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
        ) : (
          <p className="text-[15px] text-foreground-faint">No debrief history yet.</p>
        )}
      </SectionCard>

      <p className="text-[13px] text-foreground-faint">{firstName}&rsquo;s CFI can edit objectives and notes from CFI V2.</p>
    </div>
  );
}
