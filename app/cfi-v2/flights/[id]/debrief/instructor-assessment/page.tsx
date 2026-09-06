import { notFound, redirect } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { AssessmentScreen } from "@/components/student/debrief/assessment-screen";
import { AutoRefresh } from "@/components/auto-refresh";
import { PageTitle, Screen } from "@/components/student/ui";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";

/**
 * Verified-CFI-only under CFI V2 (no guest-handoff branch -- see the
 * resolver's own doc comment). Same AssessmentScreen the student side uses
 * with role="student" -- this component was already genuinely
 * role-parametrized, so nothing about it changed for CFI V2.
 */
export default async function CfiV2InstructorAssessmentPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();
  const { viewer, flight } = authorized;
  if (viewer.role !== "instructor" && viewer.role !== "admin") notFound();

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
  if (assessment?.status === "submitted") {
    redirect(`/cfi-v2/flights/${id}/debrief`);
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
      redirectTo={`/cfi-v2/flights/${id}/debrief/instructor-assessment`}
      backHref="/cfi-v2/debrief"
      kicker={cfi ? `${cfi}'s assessment` : "Instructor's assessment"}
      title="How did the student do?"
      helpText="Rate independently -- you won't see the student's self-assessment until you submit yours."
    />
  );
}
