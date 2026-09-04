import { Check } from "lucide-react";
import { BackLink, AcsBadge, Evidence, PageTitle, PrimaryButton, Screen, Section } from "@/components/prototype/ui";
import { ListenAgainRow } from "@/components/debrief/listen-again-row";
import { deriveLessonFocus } from "@/lib/lesson-focus";
import { matchSkills } from "@/lib/topics";
import { acsAreaForSkill } from "@/lib/acs";
import { formatFlightDate } from "@/lib/utils";
import type { CertificateType, FlightWithRelations, StructuredDebrief } from "@/lib/types";

/**
 * The student's own view of a completed debrief -- the approved V2
 * hierarchy from app/prototype/vector/debrief/latest: Lesson identity,
 * Listen Again, Went Well, Work On, [Instructor] Wants Next, Flight
 * Moments. Real data throughout; Flight Moments has no real production
 * source yet (no code anywhere computes approach-by-approach telemetry
 * analysis from Flight.track), so it's honestly omitted rather than
 * fabricated -- same as the prototype's own `{MOMENTS.length > 0 ? ... :
 * null}` guard.
 *
 * "How you both saw it" (the perception-gap comparison) is deliberately not
 * repeated here -- it already has its own full moment at
 * /flights/[id]/debrief/compare, right when both assessments come in.
 * Showing the identical comparison again on the completed-debrief page
 * would just be the same facts twice.
 *
 * Deliberately a new component rather than a reskin of
 * components/debrief/debrief-result-sections.tsx and debrief-replay.tsx --
 * both of those are shared with the CFI/admin viewer of this exact route
 * (see student-training-detail.tsx's "View full debrief" link), which is
 * out of scope for this pass.
 */
export function StudentDebriefV2({
  flight,
  result,
  tasks,
  instructorFirstName,
  certificateType,
  ttsEnabled,
  flightId,
  audioDurationSeconds,
}: {
  flight: FlightWithRelations;
  result: StructuredDebrief;
  tasks: { label: string; sortOrder: number }[];
  instructorFirstName: string | null;
  certificateType: CertificateType | null;
  ttsEnabled: boolean;
  flightId: string;
  audioDurationSeconds: number;
}) {
  const cfi = instructorFirstName ?? "your instructor";
  const lessonFocus = deriveLessonFocus(tasks);
  const dateLabel = formatFlightDate(flight.flightDate);

  // One supporting ACS line for the whole Work On list, not one per item --
  // matches the prototype's single <AcsBadge area={ACS_AREAS.landings} />
  // below its Work On list, not a badge decorating every bullet.
  const acsSkill = result.needsWork.map((item) => matchSkills(item)[0]?.skill).find((skill) => skill != null);
  const acsArea = acsSkill ? acsAreaForSkill(acsSkill, certificateType) : null;

  return (
    <Screen>
      <BackLink href="/debrief">Debriefs</BackLink>
      <PageTitle kicker={`${dateLabel} · ${cfi}`}>
        {lessonFocus ?? `${flight.departureAirport} → ${flight.arrivalAirport}`}
      </PageTitle>

      {ttsEnabled ? <ListenAgainRow flightId={flightId} durationSeconds={audioDurationSeconds} /> : null}

      {result.wentWell.length > 0 ? (
        <Section title="Went well">
          <ul className="flex flex-col gap-3">
            {result.wentWell.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-[17px] leading-snug text-foreground">
                <Check className="mt-1 size-4 shrink-0 text-state-good" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {result.needsWork.length > 0 ? (
        <Section title="Work on">
          <ul className="flex flex-col gap-3">
            {result.needsWork.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-[17px] leading-snug text-foreground">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-state-attention" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          {acsArea ? <AcsBadge area={acsArea.name} /> : null}
        </Section>
      ) : null}

      {result.instructorGuidance.length > 0 ? (
        <Section title={`${cfi} wants next`}>
          <div className="flex flex-col gap-5">
            {result.instructorGuidance.map((g, i) => (
              <Evidence key={i} label={g.instructorName} tone="instructor" text={g.quote} />
            ))}
          </div>
        </Section>
      ) : null}

      {/* Flight Moments: no real production capability yet -- see the doc
          comment above. Nothing renders here rather than fabricated cards. */}

      <PrimaryButton href="/next-lesson">Go to Next-Lesson Brief</PrimaryButton>
    </Screen>
  );
}
