import { notFound } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { BackLink, PageTitle, Screen } from "@/components/student/ui";
import { RevealScreen } from "@/components/student/debrief/reveal-screen";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatFlightDate } from "@/lib/utils";
import { localIsoDate } from "@/lib/date";

/**
 * Verified-CFI-only "How you both saw it" reveal. Same RevealScreen/
 * ObjectiveComparison as canonical and Student V2, with viewerIsInstructor
 * set so "You" correctly labels the instructor's own rating instead of the
 * student's -- see assessment-comparison.tsx's own doc comment for why that
 * needed a prop rather than being safe to reuse as-is.
 */
export default async function CfiV2ComparePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();
  const { flight, viewer } = authorized;
  if (viewer.role !== "instructor" && viewer.role !== "admin") notFound();

  const repo = getRepository();
  const [tasks, student, studentAssessment, instructorAssessment] = await Promise.all([
    repo.listFlightTasks(id),
    repo.getUser(flight.userId),
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
      const studentLevel = studentByTask.get(task.id);
      const instructorLevel = instructorByTask.get(task.id);
      if (!studentLevel || !instructorLevel) return null;
      return { task: task.label, student: studentLevel, instructor: instructorLevel };
    })
    .filter((row) => row !== null);

  const cfi = resolveCfiFirstName(flight.instructor);
  const dateLabel = flight.flightDate === localIsoDate() ? "Today" : formatFlightDate(flight.flightDate);

  return (
    <Screen>
      <BackLink href="/cfi-v2/debrief">Debriefs</BackLink>
      <RevealScreen
        eyebrow="Assessment comparison"
        metadata={dateLabel}
        rows={rows}
        instructorFirstName={cfi ?? "your instructor"}
        studentFirstName={student?.name?.split(" ")[0] ?? "Student"}
        viewerIsInstructor
        actionHref={`/cfi-v2/flights/${id}/debrief?started=1`}
      />
    </Screen>
  );
}
