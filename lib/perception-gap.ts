import { performanceLevelLabel, performanceLevelRank, type PerformanceLevelCode } from "@/lib/performance-levels";
import type { DiscrepancyStatus } from "@/lib/types";

/**
 * Turns a student rating and an instructor rating of the same task into
 * language a person can read.
 *
 * The underlying comparison (lib/debrief-cards/discrepancy.ts) is unchanged
 * and still deterministic. What changed is presentation: a row reading
 * "Student: 3 / Instructor: 1 / SIGNIFICANT DISAGREEMENT" is a scorecard, and
 * a scorecard invites an argument about who was right. The same two numbers
 * described as two honest perspectives invite a conversation about the flare.
 *
 * Rules every string in this file follows, and any future string must too:
 *  - Never imply the student was wrong.
 *  - Never imply the instructor was wrong.
 *  - Never imply the instructor failed to communicate.
 *  - Never read as data about instructor performance.
 * A gap is information about the LESSON, owned by neither person in it.
 */

export type GapDirection = "student_higher" | "instructor_higher" | "aligned";

export interface PerceptionGapRow {
  taskLabel: string;
  studentLevel: PerformanceLevelCode;
  instructorLevel: PerformanceLevelCode;
  status: DiscrepancyStatus;
  direction: GapDirection;
  /** "You felt confident with crosswind landings." */
  studentView: string;
  /** "Your instructor wants more consistency here." */
  instructorView: string;
  /** Neutral reading of the distance between the two, or null when they agree. */
  interpretation: string | null;
}

export function gapDirection(student: PerformanceLevelCode, instructor: PerformanceLevelCode): GapDirection {
  const d = performanceLevelRank(student) - performanceLevelRank(instructor);
  if (d === 0) return "aligned";
  return d > 0 ? "student_higher" : "instructor_higher";
}

/** How the student described their own performance, in second person. */
function studentSentence(taskLabel: string, level: PerformanceLevelCode): string {
  const task = taskLabel.toLowerCase();
  switch (level) {
    case "INDEPENDENT":
      return `You felt you had ${task} handled on your own.`;
    case "NEEDS_COACHING":
      return `You felt ${task} still needs practice.`;
    case "LEARNING":
      return `You felt you're still learning ${task}.`;
  }
}

/**
 * What the instructor recorded. Phrased as what they want NEXT rather than
 * as a grade -- the same rating read forward instead of backward.
 */
function instructorSentence(taskLabel: string, level: PerformanceLevelCode): string {
  const task = taskLabel.toLowerCase();
  switch (level) {
    case "INDEPENDENT":
      return `Your instructor is comfortable with you handling ${task} on your own.`;
    case "NEEDS_COACHING":
      return `Your instructor wants more consistency with ${task} before signing it off.`;
    case "LEARNING":
      return `Your instructor wants to keep building the fundamentals of ${task} with you.`;
  }
}

/**
 * The neutral reading. Note what it never says: not "you were overconfident,"
 * not "your instructor disagreed with you," and never a severity word shown
 * on its own. It names the direction and suggests revisiting it.
 */
function interpretation(direction: GapDirection, status: DiscrepancyStatus, taskLabel: string): string | null {
  if (direction === "aligned" || status === "none") return null;
  const task = taskLabel.toLowerCase();
  const emphasis = status === "significant" ? "worth putting near the top of the next lesson" : "worth a few minutes before the next flight";
  if (direction === "student_higher") {
    return `You felt better about ${task} than your instructor did. That's a useful thing to know now rather than later -- ${emphasis}.`;
  }
  return `Your instructor felt better about ${task} than you did. You may be closer than you think here -- ${emphasis}.`;
}

export function buildPerceptionGapRow(input: {
  taskLabel: string;
  studentLevel: PerformanceLevelCode;
  instructorLevel: PerformanceLevelCode;
  status: DiscrepancyStatus;
  /** Optional instructor note captured for this task; when present it explains the gap better than any template can. */
  note?: string | null;
}): PerceptionGapRow {
  const direction = gapDirection(input.studentLevel, input.instructorLevel);
  const note = input.note?.trim();
  return {
    taskLabel: input.taskLabel,
    studentLevel: input.studentLevel,
    instructorLevel: input.instructorLevel,
    status: input.status,
    direction,
    studentView: studentSentence(input.taskLabel, input.studentLevel),
    // A real note always beats a generated sentence -- it is what the
    // instructor actually said, rather than our rendering of a rating.
    instructorView: note ? note : instructorSentence(input.taskLabel, input.instructorLevel),
    interpretation: interpretation(direction, input.status, input.taskLabel),
  };
}

/** Headline for the whole comparison -- agreement first, never a failure count. */
export function alignmentSummary(rows: PerceptionGapRow[]): string {
  const total = rows.length;
  if (total === 0) return "";
  const aligned = rows.filter((r) => r.status === "none").length;
  if (aligned === total) return "You and your instructor saw this flight the same way, all the way through.";
  const differing = total - aligned;
  return `You and your instructor saw ${aligned} of ${total} the same way. ${differing === 1 ? "One" : differing} came out differently -- that's the useful part.`;
}

export { performanceLevelLabel };
