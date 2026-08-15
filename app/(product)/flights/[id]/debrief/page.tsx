import { redirect, notFound } from "next/navigation";
import { DebriefRecorder } from "@/components/debrief-recorder";
import { GuidedDebriefRecorder } from "@/components/debrief/guided-debrief-recorder";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";

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
            {flight.aircraft.tailNumber} · {flight.departureAirport} → {flight.arrivalAirport}
          </h1>
        </div>
        <DebriefRecorder flightId={flight.id} />
      </div>
    );
  }

  const isInstructorViewer = viewer.role === "instructor" || viewer.role === "admin";

  const tasks = await repo.listFlightTasks(id);
  if (tasks.length === 0) {
    if (isInstructorViewer) redirect(`/flights/${id}/debrief/tasks`);
    return <WaitingMessage text="Your instructor hasn't picked today's tasks yet." />;
  }

  const [studentAssessment, instructorAssessment] = await Promise.all([
    repo.getAssessment(id, "student"),
    repo.getAssessment(id, "instructor"),
  ]);

  if (!isInstructorViewer && studentAssessment?.status !== "submitted") {
    redirect(`/flights/${id}/debrief/self-assessment`);
  }
  if (isInstructorViewer && instructorAssessment?.status !== "submitted") {
    redirect(`/flights/${id}/debrief/instructor-assessment`);
  }
  if (studentAssessment?.status !== "submitted" || instructorAssessment?.status !== "submitted") {
    return (
      <WaitingMessage
        text={
          isInstructorViewer
            ? "Waiting on the student's self-assessment."
            : "Waiting on your instructor's assessment."
        }
      />
    );
  }

  const cards = await repo.listCards(id);
  if (!isInstructorViewer) {
    return <WaitingMessage text="Both assessments are in -- your instructor is starting the debrief." />;
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
          {flight.aircraft.tailNumber} · {flight.departureAirport} → {flight.arrivalAirport}
        </h1>
      </div>
      <GuidedDebriefRecorder flightId={flight.id} initialCards={cards} guidanceMode={guidanceMode} />
    </div>
  );
}

function WaitingMessage({ text }: { text: string }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-2 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Not quite yet</h1>
      <p className="text-sm text-foreground-soft">{text}</p>
    </div>
  );
}
