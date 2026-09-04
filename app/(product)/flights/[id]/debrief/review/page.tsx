import { notFound } from "next/navigation";
import { DebriefResultSections } from "@/components/debrief/debrief-result-sections";
import { DebriefWrapUp } from "@/components/debrief/debrief-wrap-up";
import { buildPerceptionGapRow, type PerceptionGapRow } from "@/lib/perception-gap";
import { discrepancyDistance, discrepancyStatusFor } from "@/lib/debrief-cards/discrepancy";
import { getRepository } from "@/lib/data";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { simplifyTrackForDisplay } from "@/lib/flight-track";
import { computeSkillProgression } from "@/lib/skill-progress";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatFlightContext } from "@/lib/utils";

/**
 * The "walk through it together" moment between recording ending and the
 * debrief actually being finalized -- see GuidedDebriefRecorder's handleEnd,
 * which lands here instead of /results now. Reachable by both roles (same
 * content either way); only the CFI gets the Finish Debrief action.
 */
export default async function DebriefReviewPage(props: PageProps<"/flights/[id]/debrief/review">) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();
  const { flight, viewer } = authorized;
  const repo = getRepository();
  const debrief = await repo.getDebriefByFlight(id);
  if (!debrief) notFound();

  const { structuredResult: result } = debrief;
  const ttsEnabled = Boolean(process.env.DEEPGRAM_API_KEY);
  const isInstructorViewer = viewer.role === "instructor" || viewer.role === "admin";
  // Guest-handoff flights have no separate verified CFI session -- the same
  // student who did the handoff is the only one who can ever finish this
  // debrief. See app/api/flights/[id]/debrief/finish/route.ts, the real
  // enforcement boundary for the action this unlocks.
  const instructorAssessment = await repo.getAssessment(id, "instructor");
  const canActAsInstructor =
    isInstructorViewer || (instructorAssessment?.attribution === "guest_handoff" && viewer.user.id === flight.userId);

  const [allStudentSignals, memberships, aircraft, flightTrainingItems] = await Promise.all([
    repo.listTrainingSignals({ studentId: flight.userId }),
    repo.listMembershipsForUser(flight.userId),
    isInstructorViewer ? repo.listAircraft(viewer.organization.id) : Promise.resolve([]),
    canActAsInstructor ? repo.listTrainingItems({ flightId: flight.id }) : Promise.resolve([]),
  ]);
  const certificateType =
    memberships.find((m) => m.organizationId === flight.organizationId)?.certificateType ?? null;
  const flightSkills = new Set(
    allStudentSignals.filter((s) => s.flightId === flight.id).map((s) => s.skill),
  );
  const flightSkillProgressions = computeSkillProgression(allStudentSignals.filter((s) => !s.dismissed)).filter((p) =>
    flightSkills.has(p.skill),
  );

  const differenceRows: PerceptionGapRow[] = result.assessmentDifferences.map((d) =>
    buildPerceptionGapRow({
      taskLabel: d.taskLabel,
      studentLevel: d.studentLevel,
      instructorLevel: d.instructorLevel,
      status: discrepancyStatusFor(discrepancyDistance(d.studentLevel, d.instructorLevel)),
      note: d.note,
    }),
  );
  const displayTrack = simplifyTrackForDisplay(flight.track);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Review Together</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{formatFlightContext(flight)}</h1>
        <p className="mt-1 text-sm text-foreground-soft">
          {canActAsInstructor
            ? "Walk through this with the student, then finish the debrief when you're both ready."
            : "Your instructor is walking through this with you before it's finalized."}
        </p>
      </div>

      {canActAsInstructor ? (
        <DebriefWrapUp
          flightId={flight.id}
          studentId={flight.userId}
          aircraft={aircraft}
          scheduleCaption={
            viewer.organization.kind === "school" ? "For your own planning -- this doesn't sync with Flight Schedule Pro." : undefined
          }
        />
      ) : null}

      <DebriefResultSections
        result={result}
        differenceRows={differenceRows}
        displayTrack={displayTrack}
        hasAdsbLookup={flight.fr24FlightId !== null}
        ttsEnabled={ttsEnabled}
        flightId={flight.id}
        flightSkillProgressions={flightSkillProgressions}
        certificateType={certificateType}
        canDismiss={canActAsInstructor}
        instructorFirstName={resolveCfiFirstName(flight.instructor)}
        editableTrainingItems={
          canActAsInstructor
            ? {
                keepWorkingOn: flightTrainingItems.filter((t) => t.category === "keep_working_on"),
                beforeNextFlight: flightTrainingItems.filter((t) => t.category === "before_next_flight"),
              }
            : undefined
        }
      />
    </div>
  );
}
