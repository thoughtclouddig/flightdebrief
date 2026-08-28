import { redirect, notFound } from "next/navigation";
import { DebriefRecorder } from "@/components/debrief-recorder";
import { GuidedDebriefRecorder } from "@/components/debrief/guided-debrief-recorder";
import { AutoRefresh } from "@/components/auto-refresh";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { formatFlightContext } from "@/lib/utils";
import type { FlightWithRelations } from "@/lib/types";

/**
 * State-machine resolver: which step of the structured debrief flow a viewer
 * sees is entirely derived from flight_tasks/debrief_assessments/debrief_cards
 * existing (or not) for this flight -- no separate status table, so closing
 * the browser mid-session is safely resumable for free. Freeform-mode orgs
 * fall straight through to the unchanged DebriefRecorder.
 */
export default async function DebriefPage(props: PageProps<"/flights/[id]/debrief">) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();
  const { flight, viewer } = authorized;

  if (flight.debriefStatus === "complete") {
    redirect(`/flights/${id}/debrief/results`);
  }

  const repo = getRepository();
  const org = flight.organizationId ? await repo.getOrganization(flight.organizationId) : null;
  const guidanceMode = org?.defaultGuidanceMode ?? "freeform";

  if (guidanceMode === "freeform") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-brand">Voice Debrief</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">
            {formatFlightContext(flight)}
          </h1>
        </div>
        {/* "Solo" is org kind, not guidance mode: a school can run freeform
            debriefs and still have a CFI in the room. Only an individual org
            has genuinely nobody else. */}
        <DebriefRecorder flightId={flight.id} solo={org?.kind === "individual"} />
      </div>
    );
  }

  const isInstructorViewer = viewer.role === "instructor" || viewer.role === "admin";

  const tasks = await repo.listFlightTasks(id);
  if (tasks.length === 0) {
    if (isInstructorViewer) redirect(`/flights/${id}/debrief/tasks`);
    return <WaitingMessage flight={flight} text="Your instructor needs to log what you worked on this flight before the debrief can start." />;
  }

  const [studentAssessment, instructorAssessment] = await Promise.all([
    repo.getAssessment(id, "student"),
    repo.getAssessment(id, "instructor"),
  ]);

  // CFI always goes first now (see the same rule enforced server-side in
  // the submit route and self-assessment/page.tsx) -- the student branch
  // only redirects to the form once the instructor's is actually in.
  if (isInstructorViewer && instructorAssessment?.status !== "submitted") {
    redirect(`/flights/${id}/debrief/instructor-assessment`);
  }
  if (!isInstructorViewer && instructorAssessment?.status !== "submitted") {
    return <WaitingMessage flight={flight} text="Your instructor needs to submit their assessment first." />;
  }
  if (!isInstructorViewer && studentAssessment?.status !== "submitted") {
    redirect(`/flights/${id}/debrief/self-assessment`);
  }
  if (studentAssessment?.status !== "submitted" || instructorAssessment?.status !== "submitted") {
    return (
      <WaitingMessage
        flight={flight}
        text={
          isInstructorViewer
            ? "Waiting on the student's self-assessment."
            : "Waiting on your instructor's assessment."
        }
      />
    );
  }

  // A recording already happened and got analyzed, but the CFI hasn't hit
  // Finish on /review yet -- send both roles there instead of back into the
  // compare/waiting/recorder branches below, so refreshing or reopening this
  // URL mid-review is safely resumable like every other step in this flow.
  const existingDebrief = await repo.getDebriefByFlight(id);
  if (existingDebrief) {
    redirect(`/flights/${id}/debrief/review`);
  }

  const cards = await repo.listCards(id);
  if (!isInstructorViewer) {
    return <WaitingMessage flight={flight} text="Both assessments are in -- your instructor is starting the debrief." />;
  }

  // Both assessments are in but the CFI hasn't come from the Compare screen
  // yet -- send them there first (its "Start the debrief" button links back
  // here with ?started=1 to skip this redirect on the way back).
  const searchParams = await props.searchParams;
  if (searchParams.started !== "1") {
    redirect(`/flights/${id}/debrief/compare`);
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Guided Debrief</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          {formatFlightContext(flight)}
        </h1>
      </div>
      <GuidedDebriefRecorder
        flightId={flight.id}
        initialCards={cards}
        guidanceMode={guidanceMode}
        taskLabels={tasks.map((t) => t.label)}
      />
    </div>
  );
}

function WaitingMessage({ flight, text }: { flight: FlightWithRelations; text: string }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-2 text-center">
      <AutoRefresh />
      <p className="text-sm font-medium uppercase tracking-wide text-brand">{formatFlightContext(flight)}</p>
      <h1 className="mt-1 text-2xl font-semibold text-foreground">Not quite yet</h1>
      <p className="text-sm text-foreground-soft">{text}</p>
    </div>
  );
}
