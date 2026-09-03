import { ExternalLink } from "lucide-react";
import {
  Card,
  Evidence,
  Panel,
  PanelEyebrow,
  PanelHeadline,
  PanelMeta,
  PrimaryButton,
  Screen,
  Section,
} from "@/components/prototype/ui";
import { ObjectiveComparison } from "@/components/prototype/assessment-comparison";
import { AcsBadge } from "@/components/acs-badge";
import { ListenButton } from "@/components/listen-button";
import { alignmentSummary, type PerceptionGapRow } from "@/lib/perception-gap";
import { matchSkills } from "@/lib/topics";
import { formatFlightContext } from "@/lib/utils";
import type { CertificateType, FlightWithRelations, StructuredDebrief } from "@/lib/types";
import type { RecurringTheme } from "@/lib/training-memory";

/**
 * The student's own view of a completed debrief, in the V2 visual language.
 *
 * Deliberately a new component rather than a reskin of
 * components/debrief/debrief-result-sections.tsx and debrief-replay.tsx --
 * both of those are shared with the CFI/admin viewer of this exact route
 * (see student-training-detail.tsx's "View full debrief" link), and the
 * Phase 3 brief scopes this pass to the Student demo only. Every prop here
 * is data results/page.tsx already computes for the existing components;
 * nothing new is fetched or derived to build this view.
 */
export function StudentDebriefV2({
  flight,
  result,
  differenceRows,
  recurringTheme,
  instructorFirstName,
  certificateType,
  ttsEnabled,
  flightId,
}: {
  flight: FlightWithRelations;
  result: StructuredDebrief;
  differenceRows: PerceptionGapRow[];
  recurringTheme: RecurringTheme | null;
  instructorFirstName: string | null;
  certificateType: CertificateType | null;
  ttsEnabled: boolean;
  flightId: string;
}) {
  const cfi = instructorFirstName ?? "your instructor";
  const dateLabel = new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  return (
    <Screen>
      <div>
        <p className="text-[15px] text-foreground-faint">{`${dateLabel} · ${cfi}`}</p>
        <h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground">
          {formatFlightContext(flight)}
        </h1>
      </div>

      {ttsEnabled ? (
        <ListenButton baseSrc={`/api/flights/${flightId}/debrief/audio`} label="Listen to your debrief" />
      ) : null}

      {result.flightSummary ? (
        <Section title="Summary" flush>
          <Card>
            <p className="text-[17px] leading-relaxed text-foreground">{result.flightSummary}</p>
          </Card>
        </Section>
      ) : null}

      {/*
       * The continuity moment: this is the ONE place the demo can honestly
       * claim "the same weakness survived the instructor handoff", because
       * it reads real per-flight instructor_id rows via
       * computeRecurringThemes (lib/training-memory.ts), not a Vector
       * inference. instructorCount is only ever >= 2 when the theme's
       * underlying flights actually span more than one instructor_id --
       * see that file's own comment for why this is stated as persistence
       * of the skill, never as anyone failing to teach it.
       */}
      {recurringTheme ? (
        <Panel>
          <PanelEyebrow>Worth extra focus</PanelEyebrow>
          <PanelHeadline>{recurringTheme.theme}</PanelHeadline>
          <PanelMeta>
            Come up in {recurringTheme.count} of your last {recurringTheme.consideredFlights} debriefs
            {recurringTheme.instructorCount >= 2 ? ` -- across ${recurringTheme.instructorCount} instructors` : ""}.
            {recurringTheme.instructorCount >= 2
              ? ` ${cfi} can see it carried over, so you won't have to start the explanation over.`
              : ""}
          </PanelMeta>
        </Panel>
      ) : null}

      {result.wentWell.length > 0 || result.needsWork.length > 0 ? (
        <Section title="Key takeaways">
          <div className="flex flex-col gap-4">
            {result.wentWell.length > 0 ? (
              <div>
                <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-state-good">Went well</p>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {result.wentWell.map((item, i) => (
                    <li key={i} className="text-[15px] leading-relaxed text-foreground-soft">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {result.needsWork.length > 0 ? (
              <div>
                <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-state-attention">Needs work</p>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {result.needsWork.map((item, i) => (
                    <li key={i} className="text-[15px] leading-relaxed text-foreground-soft">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      {/*
       * Agreement gets the same rendering as disagreement -- see the doc
       * comment on lib/perception-gap.ts. Not every row is a gap on purpose
       * (the seed pairs one disagreement with one agreement); a view that
       * only ever surfaced gaps would teach a student to distrust their own
       * read of a flight.
       */}
      {differenceRows.length > 0 ? (
        <Section title="How you both saw it" flush>
          <p className="mb-3 px-1.5 text-[15px] leading-relaxed text-foreground-soft">
            {alignmentSummary(differenceRows)}
          </p>
          <div className="flex flex-col gap-3">
            {differenceRows.map((row) => (
              <ObjectiveComparison
                key={row.taskLabel}
                task={row.taskLabel}
                student={row.studentLevel}
                instructor={row.instructorLevel}
                instructorName={cfi}
              >
                <Evidence label="You" tone="student" quoted={false} text={row.studentView} />
                <Evidence label={cfi} tone="instructor" quoted={false} text={row.instructorView} />
                {row.interpretation ? (
                  <p className="rounded-xl bg-surface-sunken px-4 py-3.5 text-[15px] leading-relaxed text-foreground-soft">
                    {row.interpretation}
                  </p>
                ) : null}
              </ObjectiveComparison>
            ))}
          </div>
        </Section>
      ) : null}

      {result.actionItems.length > 0 ? (
        <Section title="Action items">
          <ul className="flex flex-col gap-3">
            {result.actionItems.map((item, i) => {
              const skill = matchSkills(item)[0]?.skill;
              return (
                <li key={i} className="flex flex-col gap-1.5">
                  <span className="text-[15px] leading-relaxed text-foreground">{item}</span>
                  {skill ? <AcsBadge skill={skill} certificateType={certificateType} /> : null}
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      {result.studyReferences.length > 0 ? (
        <Section title="Recommended study">
          <ul className="flex flex-col gap-4">
            {result.studyReferences.map((ref, i) => (
              <li key={i} className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-foreground-faint">
                  {ref.topic}
                </span>
                {ref.url ? (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-1 text-[15px] text-brand hover:underline"
                  >
                    {ref.source}
                    <ExternalLink className="size-3 shrink-0" aria-hidden />
                  </a>
                ) : (
                  <span className="text-[15px] text-foreground-soft">{ref.source}</span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {result.nextLessonFocus.length > 0 ? (
        <Section title="Next lesson focus">
          <ol className="flex flex-col gap-2.5">
            {result.nextLessonFocus.map((focus, i) => (
              <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed text-foreground">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-semibold text-on-brand">
                  {i + 1}
                </span>
                {focus}
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      <PrimaryButton href="/next-lesson">Go to Next-Lesson Brief</PrimaryButton>
    </Screen>
  );
}
