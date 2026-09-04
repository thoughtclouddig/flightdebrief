import { notFound, redirect } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { AssessmentScreen } from "@/components/student/debrief/assessment-screen";
import { AutoRefresh } from "@/components/auto-refresh";
import { PageTitle, Screen } from "@/components/student/ui";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";

/**
 * Reached two ways -- a verified CFI/admin account on their own device, or
 * (the common case) the flight's own student continuing on the same phone
 * after the handoff at self-assessment/page.tsx's "Start instructor
 * assessment" CTA. Both land on the identical V2 rating form; see
 * lib/auth/assessment-access.ts for how each is authorized and attributed.
 * Student goes first either way -- enforced here for a direct visit, and
 * for real by the submit route.
 */
export default async function InstructorAssessmentPage(props: PageProps<"/flights/[id]/debrief/instructor-assessment">) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();
  const { viewer, flight } = authorized;
  const isInstructorViewer = viewer.role === "instructor" || viewer.role === "admin";
  if (!isInstructorViewer && viewer.user.id !== flight.userId) notFound();

  const repo = getRepository();
  const tasks = await repo.listFlightTasks(id);
  if (tasks.length === 0) notFound();

  const studentAssessment = await repo.getAssessment(id, "student");
  if (studentAssessment?.status !== "submitted") {
    return (
      <Screen>
        <AutoRefresh />
        <div className="text-center">
          <PageTitle>Not quite yet</PageTitle>
          <p className="mt-2 text-[15px] text-foreground-soft">
            The student rates it first -- this page moves on by itself once they submit.
          </p>
        </div>
      </Screen>
    );
  }

  const assessment = await repo.getAssessment(id, "instructor");
  // The student's assessment is guaranteed already submitted by this point
  // (the gate above), so once the instructor's is in too, both are -- no
  // second wait state needed here the way the pre-reversal version had.
  if (assessment?.status === "submitted") {
    redirect(`/flights/${id}/debrief`);
  }

  const cfi = resolveCfiFirstName(flight.instructor);
  const ratings = assessment ? await repo.listAssessmentRatings(assessment.id) : [];
  const initialRatings = Object.fromEntries(ratings.map((r) => [r.flightTaskId, r.performanceLevel]));

  return (
    <AssessmentScreen
      flightId={id}
      role="instructor"
      tasks={tasks.map((t) => ({ id: t.id, label: t.label, taskCode: t.taskCode }))}
      initialRatings={initialRatings}
      redirectTo={`/flights/${id}/debrief/instructor-assessment`}
      kicker={cfi ? `${cfi}'s assessment` : "Instructor's assessment"}
      title="How did the student do?"
      helpText="Rate independently -- you won't see the student's self-assessment until you submit yours."
    />
  );
}
