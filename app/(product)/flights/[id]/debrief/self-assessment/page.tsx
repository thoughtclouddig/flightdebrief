import { notFound } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { AssessmentForm } from "@/components/debrief/assessment-form";

export default async function SelfAssessmentPage(props: PageProps<"/flights/[id]/debrief/self-assessment">) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();
  const { viewer, flight } = authorized;
  if (viewer.user.id !== flight.userId) notFound();

  const repo = getRepository();
  const tasks = await repo.listFlightTasks(id);
  if (tasks.length === 0) notFound();

  const assessment = await repo.getAssessment(id, "student");
  if (assessment?.status === "submitted") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Self-assessment submitted</h1>
        <p className="text-sm text-foreground-soft">
          You&rsquo;re all set -- once your instructor submits theirs, you&rsquo;ll debrief the flight together.
        </p>
      </div>
    );
  }

  const ratings = assessment ? await repo.listAssessmentRatings(assessment.id) : [];
  const initialRatings = Object.fromEntries(ratings.map((r) => [r.flightTaskId, r.performanceLevel]));

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <AssessmentForm
        flightId={id}
        role="student"
        tasks={tasks.map((t) => ({ id: t.id, label: t.label }))}
        initialRatings={initialRatings}
        redirectTo={`/flights/${id}`}
        title="How do you think it went?"
        helpText="Rate yourself honestly on each task -- your instructor is rating separately and won't see this until they submit theirs too."
      />
    </div>
  );
}
