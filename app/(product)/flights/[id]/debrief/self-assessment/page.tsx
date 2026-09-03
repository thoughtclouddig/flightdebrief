import { notFound } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { StudentAssessmentForm } from "@/components/debrief/student-assessment-form";
import { AutoRefresh } from "@/components/auto-refresh";
import { PageTitle, PrimaryButton, Screen } from "@/components/prototype/ui";
import { formatFlightContext } from "@/lib/utils";

/** Hard-gated to the flight's own student (line below) -- never reached by an instructor/admin, so this is a safe direct rewrite, not a role branch. */
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
      <Screen>
        <AutoRefresh />
        <div className="text-center">
          <p className="text-[15px] text-foreground-faint">{formatFlightContext(flight)}</p>
          <PageTitle>Not quite yet</PageTitle>
          <p className="mt-2 text-[15px] text-foreground-soft">Your instructor needs to submit their assessment first.</p>
        </div>
      </Screen>
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
        <Screen>
          <div className="text-center">
            <PageTitle>Debrief complete</PageTitle>
            <p className="mt-2 text-[15px] text-foreground-soft">Your instructor finished walking through it.</p>
          </div>
          <PrimaryButton href={`/flights/${id}/debrief/results`}>View Debrief</PrimaryButton>
        </Screen>
      );
    }
    return (
      <Screen>
        <AutoRefresh />
        <div className="text-center">
          <PageTitle>Self-assessment submitted</PageTitle>
          <p className="mt-2 text-[15px] text-foreground-soft">You&rsquo;re all set -- your instructor is starting the debrief.</p>
        </div>
      </Screen>
    );
  }

  const ratings = assessment ? await repo.listAssessmentRatings(assessment.id) : [];
  const initialRatings = Object.fromEntries(ratings.map((r) => [r.flightTaskId, r.performanceLevel]));

  return (
    <StudentAssessmentForm
      flightId={id}
      flight={flight}
      tasks={tasks.map((t) => ({ id: t.id, label: t.label, taskCode: t.taskCode }))}
      initialRatings={initialRatings}
      redirectTo={`/flights/${id}/debrief/self-assessment`}
      title="How do you think it went?"
      helpText="Rate yourself honestly on each task -- your instructor already submitted theirs and won't see this until you submit."
    />
  );
}
