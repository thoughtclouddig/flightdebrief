import { PageTitle, Section } from "@/components/student/ui";
import { TaskPickerForm } from "@/components/debrief/task-picker-form";
import type { TrainingCategory, TrainingSkill } from "@/lib/types";

/**
 * Student-facing "what did you work on?" step -- Milestone 2A's replacement
 * for the CFI-only prerequisite a guided/light-mode flight would otherwise
 * be stuck behind. The student is confirming the SCOPE of their own
 * self-assessment, not administering the debrief or rating anything yet --
 * see assertCanSetFlightTasks (lib/auth/assessment-access.ts) for the
 * backend rule this calls into (POST /api/flights/[id]/tasks,
 * `student_confirmed` provenance, only when no tasks exist yet).
 *
 * Reuses TaskPickerForm's catalog/accordion mechanics verbatim -- the same
 * component the CFI's own /debrief/tasks page uses -- so there is one
 * picker implementation, not two kept in sync by hand. Only the framing
 * around it differs.
 *
 * AfterFlight was not in the airplane -- "we" here would read as the app
 * claiming to have flown alongside the student. hasInstructor keeps the
 * explanatory line honest for a genuinely solo flight too: this screen
 * renders before any tasks exist, for solo and instructor flights alike
 * (see app/(product)/flights/[id]/debrief/confirm/page.tsx), so it can't
 * assume a CFI is coming.
 */
export function ObjectiveConfirmationForm({
  flightId,
  allSkills,
  route,
  durationLabel,
  dateLabel,
  aircraftType,
  tailNumber,
  hasInstructor,
  redirectTo,
}: {
  flightId: string;
  allSkills: { skill: TrainingSkill; label: string; category: TrainingCategory }[];
  route: string;
  durationLabel: string;
  dateLabel: string;
  aircraftType: string;
  tailNumber: string;
  hasInstructor: boolean;
  redirectTo: string;
}) {
  return (
    <>
      <PageTitle kicker="Before you rate it">What did you work on?</PageTitle>
      <p className="text-[15px] leading-relaxed text-foreground-soft">
        {route} · {durationLabel} · {dateLabel} · {aircraftType} · {tailNumber}
      </p>
      <p className="text-[15px] leading-relaxed text-foreground-soft">
        {hasInstructor
          ? "Pick what you actually flew today. This sets the scope for your own rating -- your instructor rates the same list once you hand them the phone."
          : "Pick what you actually flew today. This sets the scope for your own rating."}
      </p>
      <Section title="Today's tasks">
        <TaskPickerForm flightId={flightId} allSkills={allSkills} initialTasks={[]} redirectTo={redirectTo} />
      </Section>
    </>
  );
}
