import { notFound } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { allTrainingSkills } from "@/lib/topics";
import { TaskPickerForm } from "@/components/debrief/task-picker-form";

export default async function FlightTasksPage(props: PageProps<"/flights/[id]/debrief/tasks">) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();
  const { viewer, flight } = authorized;
  if (viewer.role !== "instructor" && viewer.role !== "admin") notFound();

  const existing = await getRepository().listFlightTasks(id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Flight Complete</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          What did you work on today, {flight.aircraft.tailNumber}?
        </h1>
        <p className="mt-1 text-sm text-foreground-soft">
          Pick the maneuvers and tasks flown this flight. This drives what shows up on both of your
          self-assessments -- no need to cover the full syllabus every time.
        </p>
      </div>

      <TaskPickerForm
        flightId={id}
        allSkills={allTrainingSkills()}
        initialSelected={existing.map((t) => t.taskCode)}
        redirectTo={`/flights/${id}`}
      />
    </div>
  );
}
