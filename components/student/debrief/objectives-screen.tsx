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
  instructorFirstName,
  changeHref,
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
  instructorFirstName: string | null;
  changeHref: string;
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
        <a href={changeHref} className="shrink-0 text-[15px] font-medium text-brand">
          Change
        </a>
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
        {instructorFirstName
          ? `You'll rate each one first, then hand the phone to ${instructorFirstName}. Your answers stay hidden until you've both finished.`
          : "You'll rate each one first, then hand the phone to your instructor. Your answers stay hidden until you've both finished."}
      </p>

      <PrimaryButton href={startHref} onClick={onStart}>
        Start debrief
      </PrimaryButton>
    </>
  );
}
