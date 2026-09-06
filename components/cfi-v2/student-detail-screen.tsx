import Link from "next/link";
import { AssignRadioPracticeCard } from "@/components/assign-radio-practice-card";
import { RescheduleLessonForm } from "@/components/reschedule-lesson-form";
import { ScheduleLessonForm } from "@/components/schedule-lesson-form";
import { StudentNotesCard } from "@/components/student-notes-card";
import { EditableTrainingItemList } from "@/components/debrief/editable-training-item-list";
import { PerceptionGapList } from "@/components/debrief/perception-gap-list";
import { RecurrenceTimeline } from "@/components/debrief/recurrence-timeline";
import { AcsBadge } from "@/components/acs-badge";
import { SkillProgressList } from "@/components/skill-progress-list";
import { LocalDateTime } from "@/components/local-date-time";
import { PageTitle, Screen, Section } from "@/components/student/ui";
import type { CfiV2StudentDetail } from "@/lib/cfi-v2/student-detail";

/**
 * CFI V2's Student Detail -- the approved hierarchy: Next Flight, Current
 * Focus, Last Flight, Progress, Perception, History, with Practice & Notes
 * demoted to a collapsible utility section. Folds V1's separate Handoff
 * brief (app/(product)/cfi/students/[id]/handoff/page.tsx) directly in, so
 * there's no second click/second fetch to see what to expect before flying.
 */
export function CfiV2StudentDetailScreen({ detail }: { detail: CfiV2StudentDetail }) {
  const { student, brief } = detail;
  const result = detail.lastDebriefResult;
  const firstName = student.name.split(" ")[0];

  return (
    <Screen>
      <PageTitle kicker="Student pilot">{student.name}</PageTitle>

      {detail.flyingWithDifferentInstructor ? (
        <p className="rounded-2xl bg-surface-sunken px-4 py-2.5 text-[14px] text-foreground-soft">
          You didn&rsquo;t fly the last lesson &mdash; here&rsquo;s where things stand.
        </p>
      ) : null}

      {/* ---------------------------------------------------------- Next Flight */}
      <Section title="Next flight">
        <div className="flex flex-col gap-4">
          <div id="next-flight">
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">When</p>
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
                {detail.canSchedule ? (
                  <div className="mt-2">
                    <RescheduleLessonForm reservation={brief.upcomingReservation} aircraft={detail.aircraft} instructors={detail.instructors} />
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <p className="text-[15px] text-foreground-faint">Nothing scheduled yet.</p>
                {detail.canSchedule ? (
                  <div className="mt-2">
                    <ScheduleLessonForm
                      studentId={student.id}
                      aircraft={detail.aircraft}
                      instructors={detail.instructors}
                      defaultInstructorId={detail.defaultInstructorId}
                      caption={detail.scheduleCaption}
                      autoOpen
                    />
                  </div>
                ) : null}
              </>
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
      </Section>

      {/* --------------------------------------------------------- Current Focus */}
      <Section title="Current focus" flush>
        <div id="objectives" className="scroll-mt-4 rounded-2xl border border-hairline bg-surface px-5 py-4">
          <p className="mb-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">In the Air</p>
          <p className="mb-3 text-[14px] text-foreground-faint">
            What {firstName} works on next flight. Drafted from the last debrief; edit, remove, or add your own.
          </p>
          {brief.lastFlight ? (
            <EditableTrainingItemList
              flightId={brief.lastFlight.id}
              category="keep_working_on"
              initialItems={brief.keepWorkingOnTrainingItems}
              addPlaceholder="Add something to keep working on..."
            />
          ) : (
            <p className="text-[14px] text-foreground-faint">Nothing yet &mdash; no completed flights to draft from.</p>
          )}
        </div>
        {brief.lastFlight ? (
          <div className="mt-3 rounded-2xl border border-hairline bg-surface px-5 py-4">
            <p className="mb-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">On the Ground</p>
            <p className="mb-3 text-[14px] text-foreground-faint">What {firstName} should study or prep before showing up.</p>
            <EditableTrainingItemList
              flightId={brief.lastFlight.id}
              category="before_next_flight"
              initialItems={brief.beforeFlightTrainingItems}
              addPlaceholder="Add something to prep before the flight..."
            />
          </div>
        ) : null}
      </Section>

      {/* ----------------------------------------------------------- Last Flight */}
      <Section title="Last flight">
        {brief.lastFlight ? (
          <div className="flex flex-col gap-4">
            <p className="text-[14px] text-foreground-faint">
              {new Date(brief.lastFlight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              {brief.lastFlight.aircraft ? ` · ${brief.lastFlight.aircraft.tailNumber}` : ""}
            </p>
            {result ? (
              <>
                <MiniList title="Went Well" items={result.wentWell.slice(0, 3)} />
                <MiniList title="Needs Work" items={result.needsWork.slice(0, 3)} />
                {result.instructorGuidance[0] ? (
                  <blockquote className="rounded-lg bg-surface-sunken px-3 py-2 text-[14px] italic text-foreground-soft">
                    &ldquo;{result.instructorGuidance[0].quote}&rdquo;
                  </blockquote>
                ) : null}
              </>
            ) : null}
            <Link href={`/cfi-v2/flights/${brief.lastFlight.id}/debrief/results`} className="self-start text-[14px] font-semibold text-brand">
              View full debrief &rarr;
            </Link>
          </div>
        ) : (
          <p className="py-1 text-[15px] text-foreground-faint">No completed flights yet.</p>
        )}
      </Section>

      {/* -------------------------------------------------------------- Progress */}
      <Section title="Progress">
        <SkillProgressList progressions={detail.skillProgressions} certificateType={detail.certificateType} dismissible />
      </Section>

      {/* ------------------------------------------------------------ Perception */}
      {detail.perceptionGaps.length > 0 ? (
        <Section title="Where they saw it differently" flush>
          <PerceptionGapList rows={detail.perceptionGaps} />
        </Section>
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
        <Section title="Recommended starting point">
          <p className="text-[15px] text-foreground">{detail.startingPoint}</p>
        </Section>
      ) : null}

      {/* --------------------------------------------------------------- History */}
      <Section title="History">
        {detail.timeline.length > 0 ? (
          <ol className="relative flex flex-col gap-6 border-l border-hairline pl-6">
            {detail.timeline.map(({ flight, topics }) => (
              <li key={flight.id} className="relative">
                <span className="absolute -left-[29px] top-1 flex size-3.5 items-center justify-center rounded-full border-2 border-surface bg-brand" />
                <Link href={`/cfi-v2/flights/${flight.id}/debrief/results`} className="group">
                  <p className="text-[15px] font-semibold text-foreground group-hover:text-brand">
                    {new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {topics.map((topic, i) => (
                      <span key={i} className="rounded-md bg-surface-sunken px-2 py-0.5 text-[12px] font-medium text-foreground-soft">
                        {topic}
                      </span>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="py-1 text-[15px] text-foreground-faint">No debrief history yet.</p>
        )}
      </Section>

      <Link href={`/flights/new?studentId=${student.id}`} className="self-start text-[14px] font-semibold text-brand">
        Log a flight for {firstName} &rarr;
      </Link>

      {/* ------------------------------------------------------- Practice & Notes */}
      <details className="group overflow-hidden rounded-2xl border border-hairline bg-surface px-5 py-4">
        <summary className="cursor-pointer text-[14px] font-bold uppercase tracking-[0.08em] text-foreground-soft">
          Practice &amp; notes
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          <AssignRadioPracticeCard
            studentId={student.id}
            initialAssignments={detail.radioPracticeAssignments}
            suggestedScenarioId={detail.suggestedRadioScenarioId}
          />
          <StudentNotesCard studentId={student.id} initialNotes={detail.studentNotes} />
        </div>
      </details>
    </Screen>
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
