import { performanceLevelLabelFor, type PerformanceLevelCode } from "@/lib/performance-levels";
import { recurringThemeSummary, type RecurringTheme } from "@/lib/training-memory";
import type { TrainingSkill } from "@/lib/types";

export interface TaskRating {
  label: string;
  performanceLevel: PerformanceLevelCode;
}

export interface NextFlightFocus {
  headline: string;
  /** A grounded sentence explaining where the headline came from -- null only for the AI-focus-area tier, whose own text already reads as an instruction. */
  evidence: string | null;
  /**
   * Which tier produced this. Exposed (not just internal) because only the
   * recurring_theme tier carries a catalog skill code with real, queryable
   * progression data behind it -- a rating or an AI focus-area headline is
   * free text with no guarantee /progress/[skill] resolves to anything, so
   * a caller can only safely link "Review this skill" for that one tier.
   */
  kind: "recurring_theme" | "instructor_rating" | "student_rating" | "ai_focus";
  /** Only set for kind === "recurring_theme" -- the catalog skill code, safe to link to /progress/[skill]. */
  skill: TrainingSkill | null;
}

export interface NextFlightFocusInput {
  recurringTheme: RecurringTheme | null;
  instructorRatings: TaskRating[];
  studentRatings: TaskRating[];
  instructorName: string | null;
  aiFocusAreas: string[];
  /** False when the debrief this came from didn't pass lib/transcript-adequacy.ts -- the one input here with no human attribution behind it at all. */
  aiContentTrusted: boolean;
}

/**
 * Picks the single most trustworthy piece of evidence for "what to focus on
 * next," ranked by how directly it's attributable to a real judgment rather
 * than free AI prose:
 *
 *   1. A cross-flight recurring theme -- the strongest signal this product
 *      computes, persisted across multiple debriefs, not one person's read
 *      of one flight.
 *   2. A real instructor rating of "Needs Work" on the last flight.
 *   3. The student's own self-assessment rating of "Needs Work."
 *   4. The AI's own nextLessonFocus text, and only when the debrief it came
 *      from passed the transcript-adequacy gate.
 *
 * Never invents a headline: each tier either quotes a real rating a real
 * person entered, or a deterministic sentence computed from persisted
 * TrainingSignal rows (recurringThemeSummary), or nothing at all.
 */
export function deriveNextFlightFocus(input: NextFlightFocusInput): NextFlightFocus | null {
  if (input.recurringTheme) {
    return {
      headline: input.recurringTheme.theme,
      evidence: recurringThemeSummary(input.recurringTheme),
      kind: "recurring_theme",
      skill: input.recurringTheme.skill,
    };
  }

  const instructorNeedsWork = input.instructorRatings.find((r) => r.performanceLevel === "LEARNING");
  if (instructorNeedsWork && input.instructorName) {
    return {
      headline: instructorNeedsWork.label,
      evidence: `${input.instructorName} rated ${instructorNeedsWork.label} ${performanceLevelLabelFor("LEARNING", "instructor")}.`,
      kind: "instructor_rating",
      skill: null,
    };
  }

  const studentNeedsWork = input.studentRatings.find((r) => r.performanceLevel === "LEARNING");
  if (studentNeedsWork) {
    return {
      headline: studentNeedsWork.label,
      evidence: `You rated ${studentNeedsWork.label} ${performanceLevelLabelFor("LEARNING", "student")}.`,
      kind: "student_rating",
      skill: null,
    };
  }

  if (input.aiContentTrusted && input.aiFocusAreas[0]) {
    return { headline: input.aiFocusAreas[0], evidence: null, kind: "ai_focus", skill: null };
  }

  return null;
}

/**
 * "Improving" (NEEDS_COACHING) ratings not already surfaced as the main
 * focus above -- real, human-entered, worth reinforcing but not urgent.
 * excludeLabel drops whichever task the focus headline already named, so
 * the same skill never appears twice on the page.
 */
export function deriveKeepBuilding(
  instructorRatings: TaskRating[],
  studentRatings: TaskRating[],
  instructorName: string | null,
  excludeLabel: string | null,
): string[] {
  const lines: string[] = [];
  for (const r of instructorRatings) {
    if (r.performanceLevel !== "NEEDS_COACHING" || r.label === excludeLabel) continue;
    if (instructorName) lines.push(`${instructorName} rated ${r.label} ${performanceLevelLabelFor("NEEDS_COACHING", "instructor")}.`);
  }
  for (const r of studentRatings) {
    if (r.performanceLevel !== "NEEDS_COACHING" || r.label === excludeLabel) continue;
    lines.push(`You rated ${r.label} ${performanceLevelLabelFor("NEEDS_COACHING", "student")}.`);
  }
  return lines;
}
