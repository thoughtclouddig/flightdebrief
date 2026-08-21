import type { Repository } from "@/lib/data/types";
import type { FlightWithRelations } from "@/lib/types";

export type DebriefStage =
  | "awaiting_tasks"
  | "awaiting_instructor_assessment"
  | "awaiting_student_assessment"
  | "ready_to_debrief"
  | "complete";

export interface DebriefProgress {
  stage: DebriefStage;
  /** Who needs to act next -- null once nothing further is needed from either party. */
  waitingOn: "instructor" | "student" | null;
}

/**
 * The same three-tier state machine app/(product)/flights/[id]/debrief/
 * page.tsx already walks to decide which screen *the current viewer* sees,
 * extracted so it can be computed for *other* students' flights too (the
 * student dashboard's "needs your input" card, the CFI's "Students Needing
 * Attention" list) without duplicating that branching logic. CFI always
 * goes first (see the same rule enforced in the assessments submit route
 * and self-assessment/page.tsx), so a flight is never "awaiting_student"
 * until the instructor's assessment is actually in.
 */
export async function computeDebriefProgress(
  repo: Repository,
  flight: FlightWithRelations,
): Promise<DebriefProgress> {
  if (flight.debriefStatus === "complete") {
    return { stage: "complete", waitingOn: null };
  }

  const org = flight.organizationId ? await repo.getOrganization(flight.organizationId) : null;
  const guidanceMode = org?.defaultGuidanceMode ?? "freeform";

  // Freeform orgs have no task-picking/assessment step at all -- either
  // party can just start recording once the flight exists.
  if (guidanceMode === "freeform") {
    return { stage: "ready_to_debrief", waitingOn: "instructor" };
  }

  const tasks = await repo.listFlightTasks(flight.id);
  if (tasks.length === 0) {
    return { stage: "awaiting_tasks", waitingOn: "instructor" };
  }

  const instructorAssessment = await repo.getAssessment(flight.id, "instructor");
  if (instructorAssessment?.status !== "submitted") {
    return { stage: "awaiting_instructor_assessment", waitingOn: "instructor" };
  }

  const studentAssessment = await repo.getAssessment(flight.id, "student");
  if (studentAssessment?.status !== "submitted") {
    return { stage: "awaiting_student_assessment", waitingOn: "student" };
  }

  return { stage: "ready_to_debrief", waitingOn: "instructor" };
}

/** Short, human-readable label for DebriefProgress.stage -- shared so every screen phrases it the same way. */
export function debriefStageLabel(progress: DebriefProgress): string {
  switch (progress.stage) {
    case "awaiting_tasks":
      return "Needs tasks picked";
    case "awaiting_instructor_assessment":
      return "Waiting on your assessment";
    case "awaiting_student_assessment":
      return "Waiting on student";
    case "ready_to_debrief":
      return "Ready to debrief";
    case "complete":
      return "Complete";
  }
}
