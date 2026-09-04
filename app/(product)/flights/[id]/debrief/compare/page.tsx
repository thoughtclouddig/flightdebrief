import { notFound } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { BackLink, PageTitle, PrimaryButton, Screen } from "@/components/student/ui";
import { ObjectiveComparison } from "@/components/student/debrief/assessment-comparison";
import { discrepancyDistance, discrepancyStatusFor } from "@/lib/debrief-cards/discrepancy";
import { alignmentSummary, buildPerceptionGapRow, type PerceptionGapRow } from "@/lib/perception-gap";
import { deriveLessonFocus } from "@/lib/lesson-focus";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatFlightDate } from "@/lib/utils";
import { localIsoDate } from "@/lib/date";

/**
 * The "reveal" moment -- both independent assessments are in, so this is
 * the first time either side sees the other's read. Reachable by whoever
 * has this phone once both submit (verified CFI on their own device, or the
 * same student session that just finished the guest-instructor handoff --
 * see the resolver's canContinueDebrief). Adapted from
 * app/prototype/vector/debrief/new's Reveal() stage: real tasks/ratings,
 * not the fixture PERCEPTION_GAPS.
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

  const rows: PerceptionGapRow[] = tasks
    .map((task) => {
      const studentLevel = studentByTask.get(task.id);
      const instructorLevel = instructorByTask.get(task.id);
      if (!studentLevel || !instructorLevel) return null;
      return buildPerceptionGapRow({
        taskLabel: task.label,
        studentLevel,
        instructorLevel,
        status: discrepancyStatusFor(discrepancyDistance(studentLevel, instructorLevel)),
      });
    })
    .filter((row): row is PerceptionGapRow => row !== null);

  const lessonFocus = deriveLessonFocus(tasks);
  const cfi = resolveCfiFirstName(flight.instructor);
  const dateLabel = flight.flightDate === localIsoDate() ? "Today" : formatFlightDate(flight.flightDate);

  return (
    <Screen>
      <BackLink href="/debrief">Debriefs</BackLink>
      <PageTitle kicker={`${lessonFocus ?? `${flight.departureAirport} → ${flight.arrivalAirport}`} · ${dateLabel}`}>
        How you both saw it
      </PageTitle>

      {rows.length > 0 ? (
        <p className="-mt-4 px-1.5 text-[15px] leading-relaxed text-foreground-soft">{alignmentSummary(rows)}</p>
      ) : null}

      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <ObjectiveComparison
            key={row.taskLabel}
            task={row.taskLabel}
            student={row.studentLevel}
            instructor={row.instructorLevel}
            instructorName={cfi ?? "your instructor"}
          />
        ))}
      </div>

      <PrimaryButton href={`/flights/${id}/debrief?started=1`}>Talk it through</PrimaryButton>
    </Screen>
  );
}
