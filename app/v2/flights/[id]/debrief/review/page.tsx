import { notFound, redirect } from "next/navigation";
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
import { formatFlightIdentity } from "@/lib/utils";

/**
 * Real V2 Review -- REAL STATE NOT MODELED IN V2 #2, now modeled. Same
 * business logic as app/(product)/flights/[id]/debrief/review/page.tsx
 * (getAuthorizedFlight, buildPerceptionGapRow, computeSkillProgression,
 * DebriefResultSections, DebriefWrapUp) -- nothing here recomputes or
 * duplicates finalization; only the surrounding chrome changes (Screen/
 * PageTitle instead of the canonical page's plain max-w-2xl div/h1).
 *
 * Student-only (app/v2/layout.tsx already blocks any other role), and
 * further gated to this flight's own student -- canActAsInstructor is
 * still computed exactly as canonical does, since a guest-handoff student
 * (same phone, no separate CFI account) can legitimately finish the
 * debrief from here too; DebriefWrapUp itself already renders nothing for
 * a viewer who can't act (see that component's own doc comment). Jordan's
 * demo (real, non-guest-handoff CFI) never exercises that branch, but this
 * route isn't only for Jordan's specific persona.
 */
export default async function V2DebriefReviewPage(props: PageProps<"/v2/flights/[id]/debrief/review">) {
  const { id } = await props.params;
  let authorized;
  try {
    authorized = await getAuthorizedFlight(id);
  } catch {
    redirect(`/login?from=%2Fv2%2Fflights%2F${id}%2Fdebrief%2Freview&reason=no-session`);
  }
  if (!authorized) notFound();
  const { flight, viewer } = authorized;
  if (viewer.role !== "student" || viewer.user.id !== flight.userId) notFound();

  const repo = getRepository();
  const debrief = await repo.getDebriefByFlight(id);
  if (!debrief) notFound();

  const { structuredResult: result } = debrief;
  const ttsEnabled = Boolean(process.env.DEEPGRAM_API_KEY);
  const instructorAssessment = await repo.getAssessment(id, "instructor");
  const canActAsInstructor = instructorAssessment?.attribution === "guest_handoff" && viewer.user.id === flight.userId;

  const [allStudentSignals, memberships, flightTrainingItems] = await Promise.all([
    repo.listTrainingSignals({ studentId: flight.userId }),
    repo.listMembershipsForUser(flight.userId),
    canActAsInstructor ? repo.listTrainingItems({ flightId: flight.id }) : Promise.resolve([]),
  ]);
  const certificateType =
    memberships.find((m) => m.organizationId === flight.organizationId)?.certificateType ?? null;
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
      <BackLink href="/v2/debrief">Debriefs</BackLink>
      <div className="text-center">
        <PageTitle kicker="Debrief">Review together</PageTitle>
        <p className="mt-1 text-[14px] text-foreground-faint">{formatFlightIdentity(flight)}</p>
        <p className="mt-2 text-[15px] text-foreground-soft">
          {canActAsInstructor
            ? "Walk through this, then finish the debrief when you're ready."
            : `${cfi ?? "Your instructor"} is walking through this with you before it's finalized.`}
        </p>
      </div>

      {canActAsInstructor ? (
        <DebriefWrapUp
          flightId={flight.id}
          studentId={flight.userId}
          aircraft={[]}
          resultsHref={`/v2/flights/${flight.id}/debrief/results`}
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
        instructorFirstName={cfi}
        editableTrainingItems={
          canActAsInstructor
            ? {
                keepWorkingOn: flightTrainingItems.filter((t) => t.category === "keep_working_on"),
                beforeNextFlight: flightTrainingItems.filter((t) => t.category === "before_next_flight"),
              }
            : undefined
        }
      />
    </Screen>
  );
}
