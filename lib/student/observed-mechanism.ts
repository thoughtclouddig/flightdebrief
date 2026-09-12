import type { AssessmentDifference, InstructorGuidance, TrainingSkill } from "@/lib/types";
import { allTrainingSkills } from "@/lib/topics";
import { contestedObjective } from "@/lib/chair-fly";
import { extractEvidenceMechanism, type EvidenceInterpretation, type InstructorQuoteCandidate, type MechanismCategory, type ObservedMechanism } from "@/lib/ai/evidence-mechanism";

export type { EvidenceInterpretation, InstructorQuoteCandidate, MechanismCategory, ObservedMechanism };

/**
 * Every real, verbatim, attributed instructor-quote candidate that could
 * plausibly bear on this unit's skill -- the dual-assessment note (when
 * this unit is the last debrief's contested objective) plus every
 * instructorGuidance quote from the same debrief (lib/ai/prompt.ts's own
 * prompt requires these be preserved verbatim, never summarized).
 *
 * This only ASSEMBLES candidates -- it does not judge relevance or
 * mechanism-specificity itself. A quote merely mentioning this skill's
 * name is not enough to call it relevant (a keyword match answers "what
 * skill words are present," not "is this quote actually about this training
 * gap"), and relevance is a real judgment call, not something TOPIC_LIBRARY
 * metadata can decide -- see lib/ai/evidence-mechanism.ts's bounded
 * extractor, which is the only thing that decides relevance and mechanism.
 */
export function collectInstructorQuoteCandidates(
  assessmentDifferences: AssessmentDifference[],
  instructorGuidance: InstructorGuidance[],
  skill: TrainingSkill,
  cfiName: string,
): InstructorQuoteCandidate[] {
  const candidates: InstructorQuoteCandidate[] = [];

  const contested = contestedObjective(assessmentDifferences);
  if (contested?.note.trim()) {
    const contestedSkill = allTrainingSkills().find((t) => t.label.toLowerCase() === contested.taskLabel.toLowerCase())?.skill;
    if (contestedSkill === skill) candidates.push({ quote: contested.note, instructorName: cfiName });
  }

  for (const guidance of instructorGuidance) {
    if (guidance.quote.trim()) candidates.push({ quote: guidance.quote, instructorName: guidance.instructorName });
  }

  return candidates;
}

/**
 * Interprets this unit's candidate instructor quotes -- which one (if any)
 * is relevant to `skillLabel`, and whether that quote explicitly states a
 * mechanism. Delegates entirely to lib/ai/evidence-mechanism.ts's bounded
 * extractor; this wrapper only adds one more defensive degrade-to-nothing
 * layer on top, matching the product rule that any failure here must
 * never fall back to a skill-derived guess.
 */
export async function resolveEvidenceInterpretation(candidates: InstructorQuoteCandidate[], skillLabel: string): Promise<EvidenceInterpretation | null> {
  if (candidates.length === 0) return null;
  try {
    return await extractEvidenceMechanism(candidates, skillLabel);
  } catch (err) {
    console.error("[observed-mechanism] interpretation failed, degrading to no interpretation:", err);
    return null;
  }
}
