import { notFound, redirect } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { AssessmentScreen } from "@/components/student/debrief/assessment-screen";
import { AutoRefresh } from "@/components/auto-refresh";
import { PageTitle, Screen } from "@/components/student/ui";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";

/**
 * Real instructor assessment under /v2 -- identical logic to
 * app/(product)/flights/[id]/debrief/instructor-assessment/page.tsx (same
 * AssessmentScreen, same student-goes-first enforcement), hrefs repointed at
 * /v2/**.
 *
 * The "student rates first" waiting state below (PageTitle>Not quite yet)
 * is the SAME kind of real, async, no-fixture-equivalent state flagged for
 * the top-level resolver (see app/v2/flights/[id]/debrief/page.tsx's own doc
 * comment) -- reproduced here verbatim (V2 primitives, unchanged copy) since
 * it's real, already V2-styled, and not the state this milestone was asked
 * to redesign; noted as REAL STATE NOT MODELED IN V2 in the same sense, not
 * silently accepted as "done."
 */
export default async function V2InstructorAssessmentPage(props: PageProps<"/v2/flights/[id]/debrief/instructor-assessment">) {
  const { id } = await props.params;
  let authorized;
  try {
    authorized = await getAuthorizedFlight(id);
  } catch {
    redirect(`/login?from=%2Fv2%2Fflights%2F${id}%2Fdebrief%2Finstructor-assessment&reason=no-session`);
  }
  if (!authorized) notFound();
  const { viewer, flight } = authorized;
  const isInstructorViewer = viewer.role === "instructor" || viewer.role === "admin";
  // /v2 is Student-only (app/v2/layout.tsx already blocks any other role),
  // but this route is real and reachable by a verified CFI's own separate
  // canonical session too -- that visit never happens under /v2, so this
  // guard mirrors the canonical page's own authorization exactly rather than
  // assuming isInstructorViewer can never be true here.
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
  if (assessment?.status === "submitted") {
    redirect(`/v2/flights/${id}/debrief`);
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
      redirectTo={`/v2/flights/${id}/debrief/instructor-assessment`}
      kicker={cfi ? `${cfi}'s assessment` : "Instructor's assessment"}
      title="How did the student do?"
      helpText="Rate independently -- you won't see the student's self-assessment until you submit yours."
    />
  );
}
