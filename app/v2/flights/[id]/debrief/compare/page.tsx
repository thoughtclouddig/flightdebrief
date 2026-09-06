import { notFound, redirect } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { BackLink, PageTitle, Screen } from "@/components/student/ui";
import { RevealScreen } from "@/components/student/debrief/reveal-screen";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatFlightDate } from "@/lib/utils";
import { localIsoDate } from "@/lib/date";

/**
 * Real reveal/compare under /v2 -- identical logic to
 * app/(product)/flights/[id]/debrief/compare/page.tsx (same RevealScreen,
 * real tasks/ratings), hrefs repointed at /v2/**.
 */
export default async function V2ComparePage(props: PageProps<"/v2/flights/[id]/debrief/compare">) {
  const { id } = await props.params;
  let authorized;
  try {
    authorized = await getAuthorizedFlight(id);
  } catch {
    redirect(`/login?from=%2Fv2%2Fflights%2F${id}%2Fdebrief%2Fcompare&reason=no-session`);
  }
  if (!authorized) notFound();
  const { flight, viewer } = authorized;
  if (viewer.role !== "student") notFound();

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

  const cfi = resolveCfiFirstName(flight.instructor);
  const dateLabel = flight.flightDate === localIsoDate() ? "Today" : formatFlightDate(flight.flightDate);

  return (
    <Screen>
      <BackLink href="/v2/debrief">Debriefs</BackLink>
      <RevealScreen
        eyebrow="Assessment comparison"
        dateLabel={dateLabel}
        flightIdentity={`${flight.aircraft.tailNumber} · ${flight.departureAirport} → ${flight.arrivalAirport}`}
        rows={rows}
        instructorFirstName={cfi ?? "your instructor"}
        actionHref={`/v2/flights/${id}/debrief?started=1`}
      />
    </Screen>
  );
}
