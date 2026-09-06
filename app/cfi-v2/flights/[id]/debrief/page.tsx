import { redirect, notFound } from "next/navigation";
import { GuidedDebriefRecorder } from "@/components/debrief/guided-debrief-recorder";
import { AutoRefresh } from "@/components/auto-refresh";
import { PageTitle, Screen } from "@/components/student/ui";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { formatFlightIdentity } from "@/lib/utils";

/**
 * CFI V2's debrief resolver -- same state machine as
 * app/(product)/flights/[id]/debrief/page.tsx and app/v2/flights/[id]/
 * debrief/page.tsx (that file's own doc comment explains why a third
 * near-copy per tree is the established pattern here, not duplication to
 * clean up), hrefs repointed at /cfi-v2/**, instructor/admin-only.
 *
 * This is the ONE href every CFI V2 caller (Today, the Debrief queue,
 * Student Detail) points at for "continue this debrief" -- see
 * lib/cfi-v2/debrief-actions.ts's debriefResolverHref. The resolver below
 * is the single place deciding which actual sub-step to land on.
 *
 * Instructor-only, so this has no guest-handoff branch at all (that's
 * inherently a same-device student scenario) and no "waiting on CFI" state
 * (a CFI is never waiting on another CFI here) -- only "waiting on
 * student," rendered inline below.
 */
export default async function CfiV2DebriefPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ started?: string }>;
}) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();
  const { flight, viewer } = authorized;
  if (viewer.role !== "instructor" && viewer.role !== "admin") notFound();

  if (flight.debriefStatus === "complete") {
    redirect(`/cfi-v2/flights/${id}/debrief/results`);
  }

  const repo = getRepository();
  const org = flight.organizationId ? await repo.getOrganization(flight.organizationId) : null;
  const guidanceMode = org?.defaultGuidanceMode ?? "freeform";

  if (guidanceMode === "freeform") {
    // Freeform's recorder (components/debrief-recorder.tsx) is confirmed NOT
    // V2-styled (literal text-slate-*/bg-slate-900 classes) -- explicit,
    // temporary canonical fallback, same precedent Student V2's own resolver
    // already established for this exact gap. Not reachable by the CFI V2
    // demo persona (Skyline Flight Academy seeds guided mode).
    redirect(`/flights/${id}/debrief`);
  }

  const tasks = await repo.listFlightTasks(id);
  if (tasks.length === 0) {
    redirect(`/cfi-v2/flights/${id}/debrief/tasks`);
  }

  const [studentAssessment, instructorAssessment] = await Promise.all([
    repo.getAssessment(id, "student"),
    repo.getAssessment(id, "instructor"),
  ]);

  if (studentAssessment?.status !== "submitted") {
    const student = await repo.getUser(flight.userId);
    const studentFirstName = student?.name?.split(" ")[0] ?? "your student";
    return (
      <Screen>
        <AutoRefresh />
        <div className="text-center">
          <PageTitle kicker="Debrief">Hand it over</PageTitle>
          <p className="mt-1 text-[14px] text-foreground-faint">{formatFlightIdentity(flight)}</p>
          <p className="mt-2 text-[15px] text-foreground-soft">
            Ask {studentFirstName} to open AfterFlight and rate the flight first. This page moves on by itself once
            they do.
          </p>
        </div>
      </Screen>
    );
  }
  if (instructorAssessment?.status !== "submitted") {
    redirect(`/cfi-v2/flights/${id}/debrief/instructor-assessment`);
  }

  const existingDebrief = await repo.getDebriefByFlight(id);
  if (existingDebrief) {
    redirect(`/cfi-v2/flights/${id}/debrief/review`);
  }

  const cards = await repo.listCards(id);
  const searchParams = await props.searchParams;
  if (searchParams.started !== "1") {
    redirect(`/cfi-v2/flights/${id}/debrief/compare`);
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
        reviewHref={`/cfi-v2/flights/${id}/debrief/review`}
      />
    </Screen>
  );
}
