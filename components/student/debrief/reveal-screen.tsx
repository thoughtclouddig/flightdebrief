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
  dateLabel,
  flightIdentity,
  rows,
  instructorFirstName,
  studentFirstName,
  studentName,
  viewerIsInstructor = false,
  actionHref,
  onAction,
}: {
  /**
   * Deprecated in favor of `eyebrow`/`dateLabel`/`flightIdentity` -- ignored
   * whenever `eyebrow` is provided. Kept only so the one remaining caller
   * still passing a long joined string here
   * (app/(product)/flights/[id]/debrief/compare/page.tsx, canonical, out of
   * scope for this pass) keeps rendering exactly as before, with zero
   * behavior change.
   */
  kicker?: string;
  /** Short semantic eyebrow, e.g. "Assessment comparison" -- the V2/CFI-V2 compare pages pass this instead of `kicker`. */
  eyebrow?: string;
  /**
   * Compact date for the identity block's first line (e.g. "Sep 5" or
   * "Today"). Provide together with `flightIdentity`, or omit both to fall
   * back to the deprecated single-line `kicker`.
   */
  dateLabel?: string;
  /** Tail number + route for the identity block's second line, e.g. "N39WDQ · KFFZ → KFFZ". Never the assessed-area list -- the cards below already name each area. */
  flightIdentity?: string;
  rows: { task: string; student: PerformanceLevelCode; instructor: PerformanceLevelCode }[];
  instructorFirstName: string;
  /** Short label for the compact rating row ("You"/"Tomas") -- see ObjectiveComparison, whose fixed-width RatingLine needs a short name, not a full one. */
  studentFirstName?: string;
  /** Full student name for the page-level identity line (e.g. "Tomas Ruiz") -- deliberately separate from studentFirstName above, which is too short to read as a page identity statement. Only used when viewerIsInstructor is true. */
  studentName?: string;
  /** A CFI viewing this same reveal is the instructor rater, not the student -- flips which row reads "You", and which name leads the identity block. Defaults to false so every existing (student-viewer) call site is unchanged. */
  viewerIsInstructor?: boolean;
  actionHref?: string;
  onAction?: () => void;
}) {
  // Role-aware identity line: a CFI needs "whose flight is this" (the
  // student's name is the orientation that matters to them); a student
  // already knows it's their own flight, so naming their instructor instead
  // is the non-redundant version of the same question. Both use the exact
  // props this component already receives for the comparison cards below --
  // no new data, no invented identity.
  const identityLine =
    dateLabel && (viewerIsInstructor
      ? `${studentName ?? studentFirstName ?? "Student"} · ${dateLabel}`
      : `With ${instructorFirstName} · ${dateLabel}`);

  return (
    <>
      <PageTitle kicker={eyebrow ?? kicker}>How you both saw it</PageTitle>

      {identityLine && flightIdentity ? (
        <div className="mt-1 flex flex-col gap-0.5">
          <p className="text-[14px] text-foreground-faint">{identityLine}</p>
          <p className="text-[14px] text-foreground-faint">{flightIdentity}</p>
        </div>
      ) : null}

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
