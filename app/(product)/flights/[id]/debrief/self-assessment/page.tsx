import { notFound } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { AssessmentForm } from "@/components/debrief/assessment-form";
import { formatFlightContext } from "@/lib/utils";

export default async function SelfAssessmentPage(props: PageProps<"/flights/[id]/debrief/self-assessment">) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();
  const { viewer, flight } = authorized;
  if (viewer.user.id !== flight.userId) notFound();

  const repo = getRepository();
  const tasks = await repo.listFlightTasks(id);
  if (tasks.length === 0) notFound();

  // CFI must submit their assessment first -- see the same check in
  // app/api/flights/[id]/debrief/assessments/[role]/submit/route.ts, the
  // real enforcement boundary. This is the page-level half of it, so a
  // student hitting this URL directly (not via the resolver's redirect)
  // sees a clear waiting state instead of a form they can't actually submit.
  const instructorAssessment = await repo.getAssessment(id, "instructor");
  if (instructorAssessment?.status !== "submitted") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-2 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          {formatFlightContext(flight)}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Not quite yet</h1>
        <p className="text-sm text-foreground-soft">Your instructor needs to submit their assessment first.</p>
      </div>
    );
  }

  const assessment = await repo.getAssessment(id, "student");
  if (assessment?.status === "submitted") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Self-assessment submitted</h1>
        <p className="text-sm text-foreground-soft">
          You&rsquo;re all set -- your instructor is starting the debrief.
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
        role="student"
        tasks={tasks.map((t) => ({ id: t.id, label: t.label }))}
        initialRatings={initialRatings}
        redirectTo={`/flights/${id}`}
        title="How do you think it went?"
        helpText="Rate yourself honestly on each task -- your instructor already submitted theirs and won't see this until you submit."
      />
    </div>
  );
}
