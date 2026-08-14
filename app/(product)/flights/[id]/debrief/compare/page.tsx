import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { buttonVariants } from "@/components/ui/button";
import { ComparisonTable, type ComparisonRow } from "@/components/debrief/comparison-table";
import { AssessmentAlignmentInsight } from "@/components/debrief/assessment-alignment-insight";
import { discrepancyDistance, discrepancyStatusFor } from "@/lib/debrief-cards/discrepancy";

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

  const rows: ComparisonRow[] = tasks
    .map((task) => {
      const studentLevel = studentByTask.get(task.id);
      const instructorLevel = instructorByTask.get(task.id);
      if (!studentLevel || !instructorLevel) return null;
      const distance = discrepancyDistance(studentLevel, instructorLevel);
      return { taskLabel: task.label, studentLevel, instructorLevel, status: discrepancyStatusFor(distance) };
    })
    .filter((row): row is ComparisonRow => row !== null);

  const agreedCount = rows.filter((r) => r.status === "none").length;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Compare Assessments</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Where you and your instructor landed</h1>
        <p className="mt-1 text-sm text-foreground-soft">
          No one&rsquo;s right or wrong here -- differences just mean there&rsquo;s something worth talking through.
        </p>
      </div>

      <AssessmentAlignmentInsight agreedCount={agreedCount} totalCount={rows.length} />
      <ComparisonTable rows={rows} />

      <Link href={`/flights/${id}/debrief?started=1`} className={buttonVariants({ size: "lg" })}>
        Start the debrief
      </Link>
    </div>
  );
}
