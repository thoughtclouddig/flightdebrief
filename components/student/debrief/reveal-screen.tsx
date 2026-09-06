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
  eyebrow,
  metadata,
  rows,
  instructorFirstName,
  studentFirstName,
  viewerIsInstructor = false,
  actionHref,
  onAction,
}: {
  /**
   * Deprecated in favor of `eyebrow`/`metadata` -- ignored whenever `eyebrow`
   * is provided. Kept only so the one remaining caller still passing a long
   * joined string here (app/(product)/flights/[id]/debrief/compare/page.tsx,
   * canonical, out of scope for this pass) keeps rendering exactly as
   * before, with zero behavior change.
   */
  kicker?: string;
  /** Short semantic eyebrow, e.g. "Assessment comparison" -- the V2/CFI-V2 compare pages pass this instead of `kicker`. */
  eyebrow?: string;
  /**
   * Compact subordinate context shown below the title (e.g. a date) --
   * never the full list of assessed areas, which the cards below already
   * name one by one.
   */
  metadata?: string;
  rows: { task: string; student: PerformanceLevelCode; instructor: PerformanceLevelCode }[];
  instructorFirstName: string;
  /** Only needed when viewerIsInstructor is true -- see ObjectiveComparison. */
  studentFirstName?: string;
  /** A CFI viewing this same reveal is the instructor rater, not the student -- flips which row reads "You". Defaults to false so every existing (student-viewer) call site is unchanged. */
  viewerIsInstructor?: boolean;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <>
      <PageTitle kicker={eyebrow ?? kicker}>How you both saw it</PageTitle>

      {metadata ? <p className="mt-1 text-[14px] text-foreground-faint">{metadata}</p> : null}

      {rows.length > 0 ? (
        <p className="mt-3 text-[17px] leading-relaxed text-foreground-soft">{agreementSummary(rows)}</p>
      ) : null}

      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <ObjectiveComparison
            key={r.task}
            task={r.task}
            student={r.student}
            instructor={r.instructor}
            instructorName={instructorFirstName}
            studentName={studentFirstName}
            viewerIsInstructor={viewerIsInstructor}
          />
        ))}
      </div>

      <PrimaryButton href={actionHref} onClick={onAction}>
        Talk it through
      </PrimaryButton>
    </>
  );
}
