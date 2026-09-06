import { notFound } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { allTrainingSkills } from "@/lib/topics";
import { TaskPickerForm } from "@/components/debrief/task-picker-form";
import { PageTitle, Screen } from "@/components/student/ui";
import { formatFlightIdentity } from "@/lib/utils";

/** CFI-only, same as canonical -- V2 presentation, TaskPickerForm reused verbatim (already role-agnostic). */
export default async function CfiV2FlightTasksPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();
  const { viewer, flight } = authorized;
  if (viewer.role !== "instructor" && viewer.role !== "admin") notFound();

  const existing = await getRepository().listFlightTasks(id);

  return (
    <Screen>
      <div className="text-center">
        <PageTitle kicker="Debrief">What did you work on today, {flight.aircraft.tailNumber}?</PageTitle>
        <p className="mt-1 text-[14px] text-foreground-faint">{formatFlightIdentity(flight)}</p>
        <p className="mt-2 text-[15px] text-foreground-soft">
          Pick the maneuvers and tasks actually flown -- this is step one of the debrief itself, and it drives what
          shows up on both of your self-assessments next. No need to cover the full syllabus every time.
        </p>
      </div>

      <TaskPickerForm
        flightId={id}
        allSkills={allTrainingSkills()}
        initialTasks={existing.map((t) => ({ taskCode: t.taskCode, label: t.label }))}
        redirectTo={`/cfi-v2/flights/${id}/debrief`}
      />
    </Screen>
  );
}
