import type { AssessmentDifference, TrainingSkill } from "@/lib/types";
import { allTrainingSkills, curatedTrainingGuidance } from "@/lib/topics";
import { contestedObjective } from "@/lib/chair-fly";
import { rehearsalEngineFor } from "@/lib/student/vector-coaching";

/**
 * The kind of instructional need an observed mechanism represents -- kept
 * deliberately small (five buckets), not a general learning-science
 * taxonomy. RECOGNITION has no deterministic source in V1 (nothing in the
 * data model can currently support it honestly) and is never assigned --
 * it exists in the type as a documented, intentional gap, not a promise.
 */
export type MechanismCategory =
  | "UNDERSTANDING_KNOWLEDGE"
  | "RECOGNITION"
  | "SEQUENCING_REHEARSAL"
  | "COMMUNICATION_PERFORMANCE"
  | "FLIGHT_EXECUTION_TRANSFER";

export interface ObservedMechanism {
  /** The instructor's own words, verbatim -- the authoritative fact. Never a paraphrase. */
  quote: string;
  source: "instructor" | "student";
  /** Derived interpretation, not a replacement for `quote` -- see resolveMechanismCategory. */
  category: MechanismCategory;
}

/**
 * Deterministic instructional-need bucket for a skill that already has a
 * real observed mechanism -- computed only from already-real, already-
 * curated facts (which capability actually exists for this skill), never
 * from the mechanism's own words. This is NOT "mechanism exists -> engine
 * exists -> use it": the category is consulted by the strategy layer
 * alongside mechanism presence, and can still resolve to
 * FLIGHT_EXECUTION_TRANSFER even when a mechanism is known, if nothing
 * legitimate exists to act on it with.
 */
export function resolveMechanismCategory(skill: TrainingSkill): MechanismCategory {
  const engine = rehearsalEngineFor(skill);
  if (engine?.kind === "chair-fly") return "SEQUENCING_REHEARSAL";
  if (engine?.kind === "radio-practice") return "COMMUNICATION_PERFORMANCE";
  if (curatedTrainingGuidance(skill)?.checkQuestion) return "UNDERSTANDING_KNOWLEDGE";
  return "FLIGHT_EXECUTION_TRANSFER";
}

/**
 * The only source of an explicitly observed mechanism for V1: a real,
 * attributed CFI note from a guided dual-assessment debrief, when this
 * exact unit's skill is the objective that note was written about --
 * exactly the same real per-task comparison
 * lib/student/chair-fly-production-adapter.ts's buildChairFlyDrillForUnit
 * already uses (case A), reused here rather than reinvented.
 *
 * Deliberately NOT derived from free-text judgment over an arbitrary
 * TrainingItem description -- that would require either an unsafe keyword
 * heuristic or a new classifier reaching straight from raw prose to an
 * instructional conclusion, both rejected. A freeform debrief's
 * assessmentDifferences is always [] (see lib/chair-fly.ts's own doc
 * comment), so this is honestly null for the common freeform case, not
 * because nothing was said, but because nothing here can honestly tell
 * "explicit mechanism" from "general area" in raw prose without guessing.
 */
export function resolveObservedMechanism(
  assessmentDifferences: AssessmentDifference[],
  skill: TrainingSkill,
): ObservedMechanism | null {
  const contested = contestedObjective(assessmentDifferences);
  if (!contested || !contested.note.trim()) return null;

  const contestedSkill = allTrainingSkills().find((t) => t.label.toLowerCase() === contested.taskLabel.toLowerCase())?.skill;
  if (contestedSkill !== skill) return null;

  return { quote: contested.note, source: "instructor", category: resolveMechanismCategory(skill) };
}
