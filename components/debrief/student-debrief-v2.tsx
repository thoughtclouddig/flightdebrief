import { DebriefDetail } from "@/components/student/debrief/debrief-detail";
import { ListenAgainRow } from "@/components/debrief/listen-again-row";
import { PrimaryButton } from "@/components/student/ui";
import { deriveLessonFocus } from "@/lib/lesson-focus";
import { matchSkills } from "@/lib/topics";
import { acsAreaForSkill } from "@/lib/acs";
import { formatFlightDate } from "@/lib/utils";
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
    <DebriefDetail
      backHref="/debrief"
      kicker={`${dateLabel} · ${cfi}`}
      lessonTitle={lessonFocus ?? `${flight.departureAirport} → ${flight.arrivalAirport}`}
      listenAgain={ttsEnabled ? <ListenAgainRow flightId={flightId} durationSeconds={audioDurationSeconds} /> : null}
      wentWell={result.wentWell}
      workOn={result.needsWork}
      acsArea={acsArea?.name ?? null}
      instructorFirstName={cfi}
      instructorGuidance={result.instructorGuidance}
      moments={[]}
    >
      {/* No prototype equivalent -- Next-Lesson Brief is real production
          capability with nothing in the fixture demo to link to, so it
          lives here rather than in the shared hierarchy itself. */}
      <PrimaryButton href="/next-lesson">Go to Next-Lesson Brief</PrimaryButton>
    </DebriefDetail>
  );
}
