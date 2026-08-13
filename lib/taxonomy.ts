import { matchSkills } from "@/lib/topics";
import type { StructuredDebrief, TrainingCategory, TrainingSkill, TrainingSignalStatus } from "@/lib/types";

export interface TrainingSignalDraft {
  category: TrainingCategory;
  skill: TrainingSkill;
  status: TrainingSignalStatus;
  source: "STUDENT_AND_INSTRUCTOR";
  statement: string;
}

/**
 * Turns a debrief's narrative summary into normalized, aggregatable
 * TrainingSignal rows -- one per (skill, status) found in `needsWork`
 * (-> NEEDS_WORK) or `wentWell` (-> IMPROVING). The original sentence is
 * preserved verbatim as `statement`. Deliberately simple keyword matching
 * (reusing lib/topics.ts's taxonomy) rather than an LLM call: the point is
 * consistent, reproducible classification a school can trust in aggregate,
 * not another layer of AI judgment.
 *
 * Caller attaches organizationId/studentId/instructorId/aircraftId/flightId/
 * debriefId/flightDate -- this function only knows about the text.
 */
export function classifyTrainingSignals(structured: StructuredDebrief): TrainingSignalDraft[] {
  const drafts: TrainingSignalDraft[] = [];

  for (const statement of structured.needsWork) {
    for (const { category, skill } of matchSkills(statement)) {
      drafts.push({ category, skill, status: "NEEDS_WORK", source: "STUDENT_AND_INSTRUCTOR", statement });
    }
  }

  for (const statement of structured.wentWell) {
    for (const { category, skill } of matchSkills(statement)) {
      drafts.push({ category, skill, status: "IMPROVING", source: "STUDENT_AND_INSTRUCTOR", statement });
    }
  }

  return drafts;
}
