import { DebriefDetail } from "@/components/student/debrief/debrief-detail";
import { ListenAgainRow } from "@/components/debrief/listen-again-row";
import { PrimaryButton } from "@/components/student/ui";
import { deriveLessonFocus } from "@/lib/lesson-focus";
import { matchSkills } from "@/lib/topics";
import { acsAreaForSkill } from "@/lib/acs";
import { formatFlightDate } from "@/lib/utils";
import { instructorAttributionLabel } from "@/lib/instructor-attribution";
import type { CertificateType, FlightWithRelations, StructuredDebrief } from "@/lib/types";

/**
 * The production data adapter for components/student/debrief/debrief-
 * detail.tsx -- the student's own view of a completed debrief. Real data
 * throughout; Flight Moments has no real production source yet (no code
 * anywhere computes approach-by-approach telemetry analysis from
 * Flight.track), so it's passed as an empty list and the shared component
 * omits the section honestly rather than fabricating one.
 */
export function StudentDebriefV2({
  flight,
  result,
  tasks,
  certificateType,
  ttsEnabled,
  flightId,
  audioDurationSeconds,
  nextLessonHref,
}: {
  flight: FlightWithRelations;
  result: StructuredDebrief;
  tasks: { label: string; sortOrder: number }[];
  certificateType: CertificateType | null;
  ttsEnabled: boolean;
  flightId: string;
  audioDurationSeconds: number;
  /** Null where no approved destination for this concept exists yet -- renders as a known, visibly disabled gap rather than escaping to a route this tree doesn't own. */
  nextLessonHref: string | null;
}) {
  // Computed from flight.instructor directly (not received as a prop) so
  // there's one place this decision is made, not one per caller -- a real
  // Solo flight (flight.instructor === null) must never render "with your
  // instructor" copy, and instructorAttributionLabel() is what tells "no
  // instructor" apart from "instructor with an unresolvable name."
  const cfi = instructorAttributionLabel(flight.instructor);
  const lessonFocus = deriveLessonFocus(tasks);
  const dateLabel = formatFlightDate(flight.flightDate);

  // One supporting ACS line for the whole Work On list, not one per item --
  // matches the prototype's single <AcsBadge area={ACS_AREAS.landings} />
  // below its Work On list, not a badge decorating every bullet.
  const acsSkill = result.needsWork.map((item) => matchSkills(item)[0]?.skill).find((skill) => skill != null);
  const acsArea = acsSkill ? acsAreaForSkill(acsSkill, certificateType) : null;

  return (
    <DebriefDetail
      backHref="/debrief"
      kicker={cfi ? `${dateLabel} · ${cfi}` : dateLabel}
      lessonTitle={lessonFocus ?? `${flight.departureAirport} → ${flight.arrivalAirport}`}
      listenAgain={ttsEnabled ? <ListenAgainRow flightId={flightId} durationSeconds={audioDurationSeconds} /> : null}
      wentWell={result.wentWell}
      workOn={result.needsWork}
      acsArea={acsArea?.name ?? null}
      // instructorGuidance is only ever non-empty when a real instructor
      // rated this flight, so this fallback is unreachable for a solo
      // flight -- kept non-null only to satisfy DebriefDetail's prop type.
      instructorFirstName={cfi ?? "your instructor"}
      instructorGuidance={result.instructorGuidance}
      moments={[]}
    >
      {/* No prototype equivalent -- Next-Lesson Brief is real production
          capability with nothing in the fixture demo to link to, so it
          lives here rather than in the shared hierarchy itself. */}
      <PrimaryButton href={nextLessonHref ?? undefined} disabled={nextLessonHref === null}>
        Go to Next-Lesson Brief
      </PrimaryButton>
    </DebriefDetail>
  );
}
