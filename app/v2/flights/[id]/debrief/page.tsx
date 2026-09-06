import { redirect, notFound } from "next/navigation";
import { GuidedDebriefRecorder } from "@/components/debrief/guided-debrief-recorder";
import { WaitingOnCfiScreen } from "@/components/student/debrief/waiting-on-cfi-screen";
import { AutoRefresh } from "@/components/auto-refresh";
import { PageTitle, Screen } from "@/components/student/ui";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { formatFlightContext, formatFlightIdentity } from "@/lib/utils";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";

/**
 * Real guided-debrief resolver under /v2 -- same state machine as
 * app/(product)/flights/[id]/debrief/page.tsx, hrefs repointed at /v2/**,
 * Student-only (app/v2/layout.tsx already blocks any other role).
 *
 * Two real states now render real V2 presentation instead of falling back
 * to canonical:
 *
 * REAL STATE NOT MODELED IN V2 #1: async verified-CFI waiting -- both
 *   assessments submitted by real, non-guest-handoff accounts; the
 *   student's own device has nothing left to do until the CFI, on their
 *   own separate device, starts the recording. Rendered inline via
 *   WaitingOnCfiScreen rather than redirecting to canonical
 *   StudentWaitingMessage.
 *
 * REAL STATE NOT MODELED IN V2 #2: review ("walk through it together") --
 *   a Debrief row exists but hasn't been finalized yet. Now redirects to
 *   the real app/v2/flights/[id]/debrief/review/page.tsx, which reuses the
 *   canonical review page's exact business logic (DebriefResultSections/
 *   DebriefWrapUp, buildPerceptionGapRow, computeSkillProgression) under V2
 *   presentation.
 *
 * REAL STATE NOT MODELED IN V2 #3: freeform debrief mode -- still an
 *   explicit, temporary canonical fallback (see below), not accepted for
 *   general Student V2 cutover. Not reachable by this milestone's guided-
 *   mode demo persona.
 */
export default async function V2DebriefPage(props: PageProps<"/v2/flights/[id]/debrief">) {
  const { id } = await props.params;
  let authorized;
  try {
    authorized = await getAuthorizedFlight(id);
  } catch {
    redirect(`/login?from=%2Fv2%2Fflights%2F${id}%2Fdebrief&reason=no-session`);
  }
  if (!authorized) notFound();
  const { flight, viewer } = authorized;
  if (viewer.role !== "student") notFound();

  if (flight.debriefStatus === "complete") {
    redirect(`/v2/flights/${id}/debrief/results`);
  }

  const repo = getRepository();
  const org = flight.organizationId ? await repo.getOrganization(flight.organizationId) : null;
  const guidanceMode = org?.defaultGuidanceMode ?? "freeform";

  if (guidanceMode === "freeform") {
    // REAL STATE NOT MODELED IN V2 #3: freeform debrief mode. Freeform's
    // real recorder (components/debrief-recorder.tsx) is confirmed NOT
    // V2-styled (text-slate-*/bg-slate-900 literal colors, not the
    // design-token classes the rest of V2 uses) -- out of this milestone's
    // named vertical slice (guided/light mode only). Explicit, temporary
    // canonical fallback -- not accepted for general Student V2 cutover.
    redirect(`/flights/${id}/debrief`);
  }

  const tasks = await repo.listFlightTasks(id);
  if (tasks.length === 0) {
    redirect(`/v2/flights/${id}/debrief/confirm`);
  }

  const [studentAssessment, instructorAssessment] = await Promise.all([
    repo.getAssessment(id, "student"),
    repo.getAssessment(id, "instructor"),
  ]);

  if (studentAssessment?.status !== "submitted") {
    redirect(`/v2/flights/${id}/debrief/confirm`);
  }
  if (instructorAssessment?.status !== "submitted") {
    redirect(`/v2/flights/${id}/debrief/self-assessment`);
  }

  const canContinueDebrief = instructorAssessment.attribution === "guest_handoff" && viewer.user.id === flight.userId;

  const existingDebrief = await repo.getDebriefByFlight(id);
  if (existingDebrief) {
    // REAL STATE NOT MODELED IN V2 #2: review -- see this file's own doc
    // comment. Real V2 destination now, not a canonical fallback.
    redirect(`/v2/flights/${id}/debrief/review`);
  }

  const cards = await repo.listCards(id);
  if (!canContinueDebrief) {
    // REAL STATE NOT MODELED IN V2 #1: async verified-CFI waiting -- see
    // this file's own doc comment. Rendered inline, real V2 presentation,
    // not a canonical fallback.
    return (
      <Screen>
        <AutoRefresh />
        <WaitingOnCfiScreen
          flightContext={formatFlightContext(flight)}
          instructorFirstName={resolveCfiFirstName(flight.instructor)}
        />
      </Screen>
    );
  }

  const searchParams = await props.searchParams;
  if (searchParams.started !== "1") {
    redirect(`/v2/flights/${id}/debrief/compare`);
  }

  return (
    <Screen>
      <div className="text-center">
        <PageTitle kicker="Debrief">Record the debrief</PageTitle>
        <p className="mt-1 text-[14px] text-foreground-faint">{formatFlightIdentity(flight)}</p>
      </div>
      <GuidedDebriefRecorder
        flightId={flight.id}
        initialCards={cards}
        guidanceMode={guidanceMode}
        taskLabels={tasks.map((t) => t.label)}
        reviewHref={`/v2/flights/${id}/debrief/review`}
      />
    </Screen>
  );
}
