import { notFound } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { BackLink, PageTitle, Screen } from "@/components/student/ui";
import { RevealScreen } from "@/components/student/debrief/reveal-screen";
import { deriveLessonFocus } from "@/lib/lesson-focus";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatFlightDate } from "@/lib/utils";
import { localIsoDate } from "@/lib/date";

/**
 * Reachable by whoever has this phone once both assessments submit
 * (verified CFI on their own device, or the same student session that just
 * finished the guest-instructor handoff -- see the resolver's
 * canContinueDebrief). See components/student/debrief/reveal-screen.tsx
 * for the shared presentation with app/prototype/vector/debrief/new's
 * Reveal stage -- real tasks/ratings here, not the fixture PERCEPTION_GAPS.
 */
export default async function ComparePage(props: PageProps<"/flights/[id]/debrief/compare">) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();
  const { flight } = authorized;

  const repo = getRepository();
  const [tasks, studentAssessment, instructorAssessment] = await Promise.all([
    repo.listFlightTasks(id),
    repo.getAssessment(id, "student"),
    repo.getAssessment(id, "instructor"),
  ]);

  if (studentAssessment?.status !== "submitted" || instructorAssessment?.status !== "submitted") {
    return (
      <Screen>
        <div className="text-center">
          <PageTitle>Not ready yet</PageTitle>
          <p className="mt-2 text-[15px] text-foreground-soft">
            Both the student and instructor need to submit their independent assessments first.
          </p>
        </div>
      </Screen>
    );
  }

  const [studentRatings, instructorRatings] = await Promise.all([
    repo.listAssessmentRatings(studentAssessment.id),
    repo.listAssessmentRatings(instructorAssessment.id),
  ]);
  const studentByTask = new Map(studentRatings.map((r) => [r.flightTaskId, r.performanceLevel]));
  const instructorByTask = new Map(instructorRatings.map((r) => [r.flightTaskId, r.performanceLevel]));

  const rows = tasks
    .map((task) => {
      const student = studentByTask.get(task.id);
      const instructor = instructorByTask.get(task.id);
      if (!student || !instructor) return null;
      return { task: task.label, student, instructor };
    })
    .filter((row) => row !== null);

  const lessonFocus = deriveLessonFocus(tasks);
  const cfi = resolveCfiFirstName(flight.instructor);
  const dateLabel = flight.flightDate === localIsoDate() ? "Today" : formatFlightDate(flight.flightDate);

  return (
    <Screen>
      <BackLink href="/debrief">Debriefs</BackLink>
      <RevealScreen
        kicker={`${lessonFocus ?? `${flight.departureAirport} → ${flight.arrivalAirport}`} · ${dateLabel}`}
        rows={rows}
        instructorFirstName={cfi ?? "your instructor"}
        actionHref={`/flights/${id}/debrief?started=1`}
      />
    </Screen>
  );
}
