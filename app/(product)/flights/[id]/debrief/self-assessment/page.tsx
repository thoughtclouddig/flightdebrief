import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { AssessmentForm } from "@/components/debrief/assessment-form";
import { AutoRefresh } from "@/components/auto-refresh";
import { buttonVariants } from "@/components/ui/button";
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
        <AutoRefresh />
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
    // AutoRefresh polls this same server component every few seconds, so once
    // the CFI actually finishes the debrief (flight.debriefStatus flips to
    // "complete" in app/api/flights/[id]/debrief/finish/route.ts) this screen
    // updates on its own -- the student never has to notice it's stuck and
    // manually reload.
    if (flight.debriefStatus === "complete") {
      return (
        <div className="mx-auto flex max-w-xl flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Debrief complete</h1>
          <p className="text-sm text-foreground-soft">Your instructor finished walking through it.</p>
          <Link href={`/flights/${id}/debrief/results`} className={buttonVariants({ size: "lg", className: "mt-3" })}>
            View Debrief
          </Link>
        </div>
      );
    }
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-2 text-center">
        <AutoRefresh />
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
        redirectTo={`/flights/${id}/debrief/self-assessment`}
        title="How do you think it went?"
        helpText="Rate yourself honestly on each task -- your instructor already submitted theirs and won't see this until you submit."
      />
    </div>
  );
}
