import { notFound } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { AssessmentForm } from "@/components/debrief/assessment-form";
import { AutoRefresh } from "@/components/auto-refresh";
import { formatFlightContext } from "@/lib/utils";

export default async function InstructorAssessmentPage(props: PageProps<"/flights/[id]/debrief/instructor-assessment">) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();
  const { viewer, flight } = authorized;
  if (viewer.role !== "instructor" && viewer.role !== "admin") notFound();

  const repo = getRepository();
  const tasks = await repo.listFlightTasks(id);
  if (tasks.length === 0) notFound();

  const assessment = await repo.getAssessment(id, "instructor");
  if (assessment?.status === "submitted") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-2 text-center">
        <AutoRefresh />
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          {formatFlightContext(flight)}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Assessment submitted</h1>
        <p className="text-sm text-foreground-soft">
          Once the student&rsquo;s assessment is in too, you&rsquo;ll be able to compare notes before the debrief.
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
        flight={flight}
        role="instructor"
        tasks={tasks.map((t) => ({ id: t.id, label: t.label }))}
        initialRatings={initialRatings}
        redirectTo={`/flights/${id}/debrief/instructor-assessment`}
        title="How did the student do?"
        helpText="Rate independently -- you won't see the student's self-assessment until you submit yours."
      />
    </div>
  );
}
