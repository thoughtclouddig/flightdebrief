import { PageTitle, PrimaryButton } from "@/components/student/ui";
import { ObjectiveComparison } from "@/components/student/debrief/assessment-comparison";
import { agreementSummary } from "@/lib/student/assessment";
import type { PerformanceLevelCode } from "@/lib/performance-levels";

/**
 * The reveal moment -- both independent assessments are in, so this is the
 * first time either side sees the other's read. Shared between the fixture
 * demo (app/prototype/vector/debrief/new's Reveal stage) and the real
 * lifecycle (app/(product)/flights/[id]/debrief/compare), reached by
 * whoever holds this phone once both assessments submit -- a verified CFI
 * on their own device, or the same student session that just finished the
 * guest-instructor handoff.
 */
export function RevealScreen({
  kicker,
  rows,
  instructorFirstName,
  actionHref,
  onAction,
}: {
  kicker: string;
  rows: { task: string; student: PerformanceLevelCode; instructor: PerformanceLevelCode }[];
  instructorFirstName: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <>
      <PageTitle kicker={kicker}>How you both saw it</PageTitle>

      {rows.length > 0 ? (
        <p className="-mt-4 text-[17px] leading-relaxed text-foreground-soft">{agreementSummary(rows)}</p>
      ) : null}

      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <ObjectiveComparison key={r.task} task={r.task} student={r.student} instructor={r.instructor} instructorName={instructorFirstName} />
        ))}
      </div>

      <PrimaryButton href={actionHref} onClick={onAction}>
        Talk it through
      </PrimaryButton>
    </>
  );
}
