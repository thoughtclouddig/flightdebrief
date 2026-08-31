import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { buttonVariants } from "@/components/ui/button";
import { PerceptionGapList } from "@/components/debrief/perception-gap-list";
import { discrepancyDistance, discrepancyStatusFor } from "@/lib/debrief-cards/discrepancy";
import { alignmentSummary, buildPerceptionGapRow, type PerceptionGapRow } from "@/lib/perception-gap";

export default async function ComparePage(props: PageProps<"/flights/[id]/debrief/compare">) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();

  const repo = getRepository();
  const [tasks, studentAssessment, instructorAssessment] = await Promise.all([
    repo.listFlightTasks(id),
    repo.getAssessment(id, "student"),
    repo.getAssessment(id, "instructor"),
  ]);

  if (studentAssessment?.status !== "submitted" || instructorAssessment?.status !== "submitted") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Not ready yet</h1>
        <p className="text-sm text-foreground-soft">
          Both the student and instructor need to submit their independent assessments before you can compare notes.
        </p>
      </div>
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
      const distance = discrepancyDistance(studentLevel, instructorLevel);
      return buildPerceptionGapRow({
        taskLabel: task.label,
        studentLevel,
        instructorLevel,
        status: discrepancyStatusFor(distance),
      });
    })
    .filter((row): row is PerceptionGapRow => row !== null);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Compare Assessments</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Where you and your instructor landed</h1>
        <p className="mt-1 text-sm text-foreground-soft">
          Two honest views of the same flight. No one&rsquo;s right or wrong here -- where they differ is just where the
          learning is.
        </p>
      </div>

      {rows.length > 0 ? (
        <p className="rounded-lg bg-surface-sunken px-3 py-2.5 text-sm text-foreground-soft">{alignmentSummary(rows)}</p>
      ) : null}
      <PerceptionGapList rows={rows} />

      <Link href={`/flights/${id}/debrief?started=1`} className={buttonVariants({ size: "lg" })}>
        Start the debrief
      </Link>
    </div>
  );
}
