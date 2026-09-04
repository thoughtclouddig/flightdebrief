import { notFound } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { AssessmentScreen } from "@/components/student/debrief/assessment-screen";
import { HandoffScreen } from "@/components/student/debrief/handoff-screen";
import { AutoRefresh } from "@/components/auto-refresh";
import { PageTitle, PrimaryButton, Screen } from "@/components/student/ui";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";

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
  const cfi = resolveCfiFirstName(flight.instructor);

  // Student goes first now -- no gate here. The instructor's page is the
  // one that waits (see instructor-assessment/page.tsx); the real
  // enforcement boundary is app/api/flights/[id]/debrief/assessments/
  // [role]/submit/route.ts.
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
    const student = await repo.getUser(flight.userId);
    const studentFirstName = student?.name?.split(" ")[0] ?? "Your";
    return (
      <Screen>
        <AutoRefresh />
        <HandoffScreen
          headline={cfi ? `Hand the phone to ${cfi}` : "Hand the phone to your instructor"}
          body={`${cfi ? `${cfi}, this` : "This"} part is for you. ${studentFirstName}'s answers are hidden until you finish yours.`}
          actionLabel="Start instructor assessment"
          actionHref={`/flights/${id}/debrief/instructor-assessment`}
        />
      </Screen>
    );
  }

  const ratings = assessment ? await repo.listAssessmentRatings(assessment.id) : [];
  const initialRatings = Object.fromEntries(ratings.map((r) => [r.flightTaskId, r.performanceLevel]));

  return (
    <AssessmentScreen
      flightId={id}
      role="student"
      tasks={tasks.map((t) => ({ id: t.id, label: t.label, taskCode: t.taskCode }))}
      initialRatings={initialRatings}
      redirectTo={`/flights/${id}/debrief/self-assessment`}
      kicker="Your assessment"
      title="How did this feel to you?"
      helpText={`Your own read of the flight, before you see anything else. There is no wrong answer here -- it is what you thought.${cfi ? ` You'll rate each one first, then hand the phone to ${cfi}.` : ""}`}
    />
  );
}
