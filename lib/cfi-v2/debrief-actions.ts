import type { DebriefStage } from "@/lib/debrief-progress";

/**
 * Shared by CFI V2's Today ("Needs You Now") and the Debrief queue -- one
 * place mapping a lifecycle stage to what a CFI should be told and how
 * urgent it is, so the two screens can never describe the same stage two
 * different ways.
 */
export interface StageActionInfo {
  ctaLabel: string;
  /** Lower = more urgent. "Waiting on student" sorts last -- nothing here is the instructor's next move. */
  priority: number;
  /** False for a stage where the instructor has nothing to do right now (only the student does). */
  instructorActionable: boolean;
}

export const STAGE_ACTION_INFO: Record<Exclude<DebriefStage, "complete">, StageActionInfo> = {
  awaiting_finish: { ctaLabel: "Review", priority: 0, instructorActionable: true },
  ready_to_debrief: { ctaLabel: "Record debrief", priority: 1, instructorActionable: true },
  awaiting_instructor_assessment: { ctaLabel: "Assess", priority: 2, instructorActionable: true },
  awaiting_tasks: { ctaLabel: "Confirm objectives", priority: 3, instructorActionable: true },
  awaiting_student_assessment: { ctaLabel: "View flight", priority: 4, instructorActionable: false },
};

/**
 * The single entry point into the CFI V2 debrief lifecycle for a given
 * flight. Deliberately the ONLY href a caller ever needs for "continue this
 * debrief" -- the resolver at this route (app/cfi-v2/flights/[id]/debrief/
 * page.tsx) is the one place that decides which actual sub-step to land on,
 * so Today/the Debrief queue never hand-compute a stage-specific sub-route
 * themselves. That would be a second copy of the lifecycle's own branching
 * logic, which is exactly what this milestone's audit flagged as a risk
 * ("do not invent a new lifecycle"/"do not hardcode fake state
 * transitions") -- if the resolver's own rules ever change, every caller of
 * this one function stays correct for free.
 */
export function debriefResolverHref(flightId: string): string {
  return `/cfi-v2/flights/${flightId}/debrief`;
}
