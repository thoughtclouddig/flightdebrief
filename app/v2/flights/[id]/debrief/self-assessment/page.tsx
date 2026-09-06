import { notFound, redirect } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { AssessmentScreen } from "@/components/student/debrief/assessment-screen";
import { HandoffScreen } from "@/components/student/debrief/handoff-screen";
import { AutoRefresh } from "@/components/auto-refresh";
import { PageTitle, PrimaryButton, Screen } from "@/components/student/ui";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";

/**
 * Real self-assessment under /v2 -- identical logic to
 * app/(product)/flights/[id]/debrief/self-assessment/page.tsx (same
 * AssessmentScreen/HandoffScreen, same real submit-route enforcement), hrefs
 * repointed at /v2/**. Hard-gated to the flight's own student, same as the
 * canonical version.
 */
export default async function V2SelfAssessmentPage(props: PageProps<"/v2/flights/[id]/debrief/self-assessment">) {
  const { id } = await props.params;
  let authorized;
  try {
    authorized = await getAuthorizedFlight(id);
  } catch {
    redirect(`/login?from=%2Fv2%2Fflights%2F${id}%2Fdebrief%2Fself-assessment&reason=no-session`);
  }
  if (!authorized) notFound();
  const { viewer, flight } = authorized;
  if (viewer.role !== "student" || viewer.user.id !== flight.userId) notFound();

  const repo = getRepository();
  const tasks = await repo.listFlightTasks(id);
  if (tasks.length === 0) notFound();
  const cfi = resolveCfiFirstName(flight.instructor);

  const assessment = await repo.getAssessment(id, "student");
  if (assessment?.status === "submitted") {
    if (flight.debriefStatus === "complete") {
      return (
        <Screen>
          <div className="text-center">
            <PageTitle>Debrief complete</PageTitle>
            <p className="mt-2 text-[15px] text-foreground-soft">Your instructor finished walking through it.</p>
          </div>
          <PrimaryButton href={`/v2/flights/${id}/debrief/results`}>View Debrief</PrimaryButton>
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
          actionHref={`/v2/flights/${id}/debrief/instructor-assessment`}
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
      redirectTo={`/v2/flights/${id}/debrief/self-assessment`}
      backHref="/v2/debrief"
      kicker="Your assessment"
      title="How did this feel to you?"
      helpText={`Your own read of the flight, before you see anything else. There is no wrong answer here -- it is what you thought.${cfi ? ` You'll rate each one first, then hand the phone to ${cfi}.` : ""}`}
    />
  );
}
