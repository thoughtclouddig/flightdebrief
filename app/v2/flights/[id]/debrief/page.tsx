import { redirect, notFound } from "next/navigation";
import { GuidedDebriefRecorder } from "@/components/debrief/guided-debrief-recorder";
import { PageTitle, Screen } from "@/components/student/ui";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { formatFlightContext } from "@/lib/utils";

/**
 * Real guided-debrief resolver under /v2 -- same state machine as
 * app/(product)/flights/[id]/debrief/page.tsx, hrefs repointed at /v2/**,
 * Student-only (app/v2/layout.tsx already blocks any other role).
 *
 * Two real states fall back to their CANONICAL URL instead of rendering
 * anything under /v2, per this milestone's explicit instruction not to
 * invent presentation for a state the approved V2 reference has no
 * equivalent for:
 *
 * REAL STATE NOT MODELED IN V2: async verified-CFI waiting
 *   Backend state: both assessments submitted by real, non-guest-handoff
 *     accounts; the student's own device has nothing left to do until the
 *     CFI, on their own separate device, starts the recording.
 *   When it occurs: guided/light-mode flight, real (not guest-handoff) CFI
 *     account, canContinueDebrief === false for the student viewer.
 *   Current canonical behavior: StudentWaitingMessage
 *     (app/(product)/flights/[id]/debrief/page.tsx) -- Screen/Panel/
 *     PanelEyebrow, "Both of you have rated this flight" / "what happens
 *     next" copy, AutoRefresh.
 *   Why /v2 has no equivalent: the approved reference
 *     (components/student/debrief/guided-debrief-demo.tsx) simulates both
 *     roles in one client-side session -- it never had a second real
 *     account to wait on.
 *   Decision needed: whether/how this state gets its own approved V2
 *     presentation, not just a redirect back to canonical.
 *
 * REAL STATE NOT MODELED IN V2: review ("walk through it together")
 *   Backend state: a Debrief row exists but hasn't been finalized yet.
 *   When it occurs: after recording ends, before either party finishes.
 *   Current canonical behavior: app/(product)/flights/[id]/debrief/review/
 *     page.tsx -- confirmed NOT V2-styled (max-w-2xl, text-slate-adjacent
 *     generic markup, shared verbatim between student and CFI, no
 *     student-specific variant the way /results has StudentDebriefV2).
 *   Why /v2 has no equivalent: this page was never given a V2 presentation
 *     pass at all, unlike every other step in this flow.
 *   Decision needed: a real V2 Review screen needs to be designed, not
 *     wired -- this is new product design, not an adapter gap.
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
    // Freeform's real recorder (components/debrief-recorder.tsx) is
    // confirmed NOT V2-styled (text-slate-*/bg-slate-900 literal colors, not
    // the design-token classes the rest of V2 uses) -- also out of this
    // milestone's named vertical slice (guided/light mode). Falling back to
    // canonical rather than wiring visibly-V1 markup under /v2 or silently
    // restyling a component this milestone didn't ask for.
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
    // REAL STATE NOT MODELED IN V2: review -- see this file's own doc
    // comment. Falls back to canonical rather than inventing a V2 Review
    // screen.
    redirect(`/flights/${id}/debrief/review`);
  }

  const cards = await repo.listCards(id);
  if (!canContinueDebrief) {
    // REAL STATE NOT MODELED IN V2: async verified-CFI waiting -- see this
    // file's own doc comment. Falls back to canonical rather than carrying
    // forward 65775c3's redesigned StudentWaitingMessage, which was never
    // approved as part of the V2 reference.
    redirect(`/flights/${id}/debrief`);
  }

  const searchParams = await props.searchParams;
  if (searchParams.started !== "1") {
    redirect(`/v2/flights/${id}/debrief/compare`);
  }

  return (
    <Screen>
      <div className="text-center">
        <p className="text-[15px] text-foreground-faint">{formatFlightContext(flight)}</p>
        <PageTitle>Record the debrief</PageTitle>
      </div>
      <GuidedDebriefRecorder
        flightId={flight.id}
        initialCards={cards}
        guidanceMode={guidanceMode}
        taskLabels={tasks.map((t) => t.label)}
      />
    </Screen>
  );
}
