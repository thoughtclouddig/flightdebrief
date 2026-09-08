import { Card, PageTitle, PrimaryButton, Section } from "@/components/student/ui";

/**
 * "Confirm this is the flight and these are the things we're about to
 * debrief" -- the canonical Lesson Confirmation screen, shared between the
 * fixture demo (app/prototype/vector/debrief/new's objectives stage) and
 * the real flow (app/(product)/flights/[id]/debrief/confirm). Serves two
 * purposes either way: confirm WHICH flight, and remind the student WHAT
 * they trained before asking them to assess it.
 *
 * Pure presentation -- both callers already wrap this in their own Screen/
 * BackLink (the prototype's covers every stage in its state machine; the
 * production route is a standalone page), so this renders only the content
 * between them.
 */
export function ObjectivesScreen({
  lessonTitle,
  route,
  durationLabel,
  dateLabel,
  aircraftType,
  tailNumber,
  objectives,
  hasInstructor,
  instructorFirstName,
  startHref,
  onStart,
}: {
  lessonTitle: string;
  route: string;
  durationLabel: string;
  dateLabel: string;
  aircraftType: string;
  tailNumber: string;
  objectives: string[];
  /**
   * Whether this flight has a real instructor attached at all -- distinct
   * from instructorFirstName below, which is only about whether a name could
   * be derived. A flight can have an instructor with no resolvable first
   * name; it can never have `hasInstructor: false` with a real CFI still
   * waiting for a handoff. Solo flights (hasInstructor: false) get their own
   * honest copy, never "hand the phone to your instructor."
   */
  hasInstructor: boolean;
  instructorFirstName: string | null;
  startHref?: string;
  onStart?: () => void;
}) {
  return (
    <>
      <PageTitle kicker="Today's lesson">{lessonTitle}</PageTitle>

      <Card className="flex items-center gap-3">
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-medium text-foreground">
            {route} · {durationLabel}
          </span>
          <span className="mt-0.5 block text-[15px] text-foreground-faint">
            {dateLabel} · {aircraftType} · {tailNumber}
          </span>
        </span>
      </Card>

      <Section title="Today's objectives">
        <ul className="flex flex-col gap-3">
          {objectives.map((o, i) => (
            <li key={o} className="flex items-baseline gap-3 text-[17px] leading-snug text-foreground">
              <span className="text-[13px] font-semibold tabular-nums text-foreground-faint">{i + 1}</span>
              {o}
            </li>
          ))}
        </ul>
      </Section>

      <p className="text-[15px] leading-relaxed text-foreground-soft">
        {hasInstructor
          ? instructorFirstName
            ? `You'll rate each one first, then hand the phone to ${instructorFirstName}. Your answers stay hidden until you've both finished.`
            : "You'll rate each one first, then hand the phone to your instructor. Your answers stay hidden until you've both finished."
          : "This is your own read of the flight -- there's no one else to hand the phone to."}
      </p>

      <PrimaryButton href={startHref} onClick={onStart}>
        Start debrief
      </PrimaryButton>
    </>
  );
}
