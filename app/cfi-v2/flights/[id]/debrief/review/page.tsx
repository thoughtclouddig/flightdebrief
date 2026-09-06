import { notFound } from "next/navigation";
import { DebriefResultSections } from "@/components/debrief/debrief-result-sections";
import { DebriefWrapUp } from "@/components/debrief/debrief-wrap-up";
import { BackLink, PageTitle, Screen } from "@/components/student/ui";
import { buildPerceptionGapRow, type PerceptionGapRow } from "@/lib/perception-gap";
import { discrepancyDistance, discrepancyStatusFor } from "@/lib/debrief-cards/discrepancy";
import { getRepository } from "@/lib/data";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { simplifyTrackForDisplay } from "@/lib/flight-track";
import { computeSkillProgression } from "@/lib/skill-progress";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatFlightContext } from "@/lib/utils";

/**
 * "Review Together" + Finish Debrief -- verified-CFI-only under CFI V2 (no
 * guest-handoff branch; that's a same-device student scenario, not
 * reachable from this instructor-only tree). Same business logic as
 * canonical/Student V2's review pages (getAuthorizedFlight,
 * buildPerceptionGapRow, computeSkillProgression, DebriefResultSections,
 * DebriefWrapUp) -- nothing here recomputes or duplicates finalization.
 */
export default async function CfiV2DebriefReviewPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();
  const { flight, viewer } = authorized;
  if (viewer.role !== "instructor" && viewer.role !== "admin") notFound();

  const repo = getRepository();
  const debrief = await repo.getDebriefByFlight(id);
  if (!debrief) notFound();

  const { structuredResult: result } = debrief;
  const ttsEnabled = Boolean(process.env.DEEPGRAM_API_KEY);

  const [allStudentSignals, memberships, aircraft, flightTrainingItems] = await Promise.all([
    repo.listTrainingSignals({ studentId: flight.userId }),
    repo.listMembershipsForUser(flight.userId),
    repo.listAircraft(viewer.organization.id),
    repo.listTrainingItems({ flightId: flight.id }),
  ]);
  const certificateType = memberships.find((m) => m.organizationId === flight.organizationId)?.certificateType ?? null;
  const flightSkills = new Set(allStudentSignals.filter((s) => s.flightId === flight.id).map((s) => s.skill));
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
  const cfi = resolveCfiFirstName(flight.instructor);

  return (
    <Screen>
      <BackLink href="/cfi-v2/debrief">Debriefs</BackLink>
      <div className="text-center">
        <p className="text-[15px] text-foreground-faint">{formatFlightContext(flight)}</p>
        <PageTitle>Review together</PageTitle>
        <p className="mt-2 text-[15px] text-foreground-soft">
          Walk through this with the student, then finish the debrief when you&rsquo;re both ready.
        </p>
      </div>

      <DebriefWrapUp
        flightId={flight.id}
        studentId={flight.userId}
        aircraft={aircraft}
        scheduleCaption={
          viewer.organization.kind === "school" ? "For your own planning -- this doesn't sync with Flight Schedule Pro." : undefined
        }
        resultsHref={`/cfi-v2/flights/${flight.id}/debrief/results`}
      />

      <DebriefResultSections
        result={result}
        differenceRows={differenceRows}
        displayTrack={displayTrack}
        hasAdsbLookup={flight.fr24FlightId !== null}
        ttsEnabled={ttsEnabled}
        flightId={flight.id}
        flightSkillProgressions={flightSkillProgressions}
        certificateType={certificateType}
        canDismiss
        instructorFirstName={cfi}
        editableTrainingItems={{
          keepWorkingOn: flightTrainingItems.filter((t) => t.category === "keep_working_on"),
          beforeNextFlight: flightTrainingItems.filter((t) => t.category === "before_next_flight"),
        }}
      />
    </Screen>
  );
}
