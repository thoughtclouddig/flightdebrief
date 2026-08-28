/**
 * Deterministic guard against junk training items reaching a student's list.
 *
 * lib/ai/prompt.ts already tells the model that every needsWork entry must
 * name a specific skill and must not be a narrative recap -- but a prompt is
 * a request, not a constraint, and items that slip through are permanent:
 * they pile up on /progress with no way for a student to remove them and no
 * way for a CFI to reach them once a later flight has been debriefed.
 *
 * Rejects two shapes, both seen in real debriefs:
 *   1. Vague restatements with no nameable skill -- "Need to keep working on
 *      that", "more practice needed".
 *   2. Narrative recaps of what happened, which belong in instructorAssistance
 *      -- "Danny walked me through an engine-out and had me pick a field".
 *
 * Deliberately conservative: it only drops entries matching these explicit
 * shapes, because wrongly discarding a real observation is worse than letting
 * a marginal one through.
 */

/** Whole-string shapes that carry no nameable skill. */
const VAGUE_PATTERNS: RegExp[] = [
  /^(?:i\s+)?(?:need|needs|needed)\s+to\s+(?:keep\s+)?work(?:ing)?\s+on\s+(?:that|this|it|those|these)\b/i,
  /^(?:just\s+)?(?:keep|keeps|keeping)\s+work(?:ing)?\s+on\s+(?:that|this|it|those|these)\b/i,
  /^(?:needs?|need)\s+(?:more|additional)\s+practice\b/i,
  /^(?:more|additional)\s+practice\b/i,
  /^practice\s+(?:more|again)\b/i,
  /^(?:work|working)\s+on\s+(?:that|this|it)\b/i,
  /^(?:get|getting)\s+better\s+at\s+(?:that|this|it)\b/i,
];

/**
 * Past-tense narration of the lesson rather than a skill to improve. Anchored
 * to the sentence opening so "Crosswind landings -- instructor demonstrated
 * one" (a real skill, with context) survives while "Instructor demonstrated
 * a crosswind landing" does not.
 */
const NARRATIVE_PATTERNS: RegExp[] = [
  /^\s*\w+\s+(?:walked|talked|took|showed|demonstrated|had)\s+(?:me|us|the student)\b/i,
  /^\s*(?:my\s+)?instructor\s+(?:walked|talked|took|showed|demonstrated|had|helped|corrected|reminded|prompted)\b/i,
  /^\s*(?:we|i)\s+(?:did|went over|practiced|worked on|reviewed)\s+/i,
];

export function isLowQualityTrainingItem(description: string): boolean {
  const text = description.trim();
  if (!text) return true;
  // A bare fragment can't name a skill AND say something about it.
  if (text.split(/\s+/).length < 2) return true;
  return [...VAGUE_PATTERNS, ...NARRATIVE_PATTERNS].some((re) => re.test(text));
}

/** Drops low-quality entries, preserving order and the caller's element type. */
export function filterTrainingItemDescriptions(descriptions: string[]): string[] {
  return descriptions.filter((d) => !isLowQualityTrainingItem(d));
}
