import type { Repository } from "@/lib/data/types";
import type { AssessmentAttribution, FlightWithRelations } from "@/lib/types";

export type DebriefStage =
  | "awaiting_tasks"
  | "awaiting_instructor_assessment"
  | "awaiting_student_assessment"
  | "ready_to_debrief"
  | "awaiting_finish"
  | "complete";

export interface DebriefProgress {
  stage: DebriefStage;
  /** Who needs to act next -- null once nothing further is needed from either party. */
  waitingOn: "instructor" | "student" | null;
  /**
   * Only meaningful at "ready_to_debrief": whether the instructor's
   * assessment (once it exists) was a same-phone guest handoff rather than
   * a verified CFI account. A guest-handoff student who reaches this stage
   * still has something to do themselves (continue into recording, on the
   * same session) -- a verified-CFI student genuinely doesn't, since a
   * separate account has to pick up from here. Undefined everywhere else,
   * and whenever the instructor assessment doesn't exist yet -- attribution
   * isn't decided until whoever rates it actually starts.
   */
  instructorAttribution?: AssessmentAttribution;
}

/**
 * The same three-tier state machine app/(product)/flights/[id]/debrief/
 * page.tsx already walks to decide which screen *the current viewer* sees,
 * extracted so it can be computed for *other* students' flights too (the
 * student dashboard's "needs your input" card, the CFI's "Students Needing
 * Attention" list) without duplicating that branching logic. Student always
 * goes first now (see the same rule enforced in the assessments submit
 * route and instructor-assessment/page.tsx), so a flight is never
 * "awaiting_instructor" until the student's own assessment is actually in.
 */
export async function computeDebriefProgress(
  repo: Repository,
  flight: FlightWithRelations,
): Promise<DebriefProgress> {
  if (flight.debriefStatus === "complete") {
    return { stage: "complete", waitingOn: null };
  }

  // Guided/light mode doesn't flip debriefStatus to "complete" until the CFI
  // walks the results with the student and clicks "Finish" on /review (see
  // app/api/flights/[id]/debrief/finish/route.ts) -- recording and analysis
  // happen well before that. A Debrief row already existing means the
  // task/assessment checks below, which describe a flight that hasn't even
  // been recorded yet, would be stale here.
  const existingDebrief = await repo.getDebriefByFlight(flight.id);
  if (existingDebrief) {
    return { stage: "awaiting_finish", waitingOn: "instructor" };
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

  const studentAssessment = await repo.getAssessment(flight.id, "student");
  if (studentAssessment?.status !== "submitted") {
    return { stage: "awaiting_student_assessment", waitingOn: "student" };
  }

  const instructorAssessment = await repo.getAssessment(flight.id, "instructor");
  if (instructorAssessment?.status !== "submitted") {
    return { stage: "awaiting_instructor_assessment", waitingOn: "instructor" };
  }

  return { stage: "ready_to_debrief", waitingOn: "instructor", instructorAttribution: instructorAssessment.attribution };
}

/** Short, human-readable label for DebriefProgress.stage -- shared so every screen phrases it the same way. */
export function debriefStageLabel(progress: DebriefProgress): string {
  switch (progress.stage) {
    case "awaiting_tasks":
      return "Objectives not confirmed yet";
    case "awaiting_instructor_assessment":
      return "Waiting on your assessment";
    case "awaiting_student_assessment":
      return "Waiting on student";
    case "ready_to_debrief":
      return "Ready to debrief";
    case "awaiting_finish":
      return "Recorded -- pending your review";
    case "complete":
      return "Complete";
  }
}
