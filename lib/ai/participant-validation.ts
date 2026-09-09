import type { StructuredDebriefResult } from "./schema";

/**
 * Deterministic backstop, not the primary fix. The primary fix is upstream
 * in prompt.ts, which now tells the model explicitly and unambiguously
 * whether a flight was solo -- but a prompt is a request, not a constraint
 * (see lib/transcript-adequacy.ts's own doc comment for the earlier
 * incident that established this rule for this exact pipeline). A real
 * Staging debrief for a genuinely solo flight (flight.instructor === null)
 * got back a spoken narration saying "you and your instructor" despite
 * that explicit framing. This runs after every analysis call -- Claude or
 * the mock fallback -- so a violation can't reach a persisted debrief or a
 * spoken narration regardless of why the model produced it.
 *
 * Deliberately drops violating content rather than rewriting it. "You and
 * your instructor identified X" can't be safely edited into "You noticed
 * X" without guessing at what actually happened -- that guess is itself a
 * fabrication, just a smaller one. Every field here already has a real,
 * non-fabricated way to be empty: buildDebriefNarration's own template
 * falls back to solo-only copy when narrativeRecap is empty
 * (lib/debrief-narration.ts), and the results page already omits empty
 * wentWell/needsWork/etc. sections. Dropping a violating entry lands on
 * exactly those existing, honest fallbacks -- it never invents a
 * replacement.
 */

const PARTICIPANT_REFERENCE_PATTERNS: RegExp[] = [
  /\byour instructor\b/i,
  /\byour cfi\b/i,
  /\byou\s+(?:and|with)\s+(?:your\s+)?(?:instructor|cfi)\b/i,
  /\byou\s+both\b/i,
  /\byou\s+two\b/i,
  /\byou\s+guys\b/i,
  /\binstructor\s+(?:said|noticed|noted|wants?|felt|thought|agreed|disagreed)\b/i,
  /\byou\s+agreed\b/i,
  /\byou\s+disagreed\b/i,
];

function containsParticipantReference(text: string): boolean {
  return PARTICIPANT_REFERENCE_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Drops any field claiming instructor participation on a flight that had
 * none. hasInstructor must be the canonical flight.instructor !== null
 * signal (see lib/instructor-attribution.ts) -- never re-derived from the
 * model's own output, which is exactly the thing being validated.
 */
export function stripUnsupportedParticipantReferences(
  structured: StructuredDebriefResult,
  hasInstructor: boolean,
): StructuredDebriefResult {
  if (hasInstructor) return structured;

  // instructorGuidance/instructorAssistance both require a real instructor
  // to exist at all -- one attributes a quote, the other records where an
  // instructor "intervened, prompted, or corrected." Both are structurally
  // invalid on a solo flight regardless of content (e.g. "Instructor took
  // the controls during the go-around" has no participant-reference phrase
  // to pattern-match, but is exactly as false as one that does), so both
  // are emptied wholesale rather than scanned phrase-by-phrase.
  const instructorGuidance = structured.instructorGuidance.length > 0 ? [] : structured.instructorGuidance;
  const instructorAssistance = structured.instructorAssistance.length > 0 ? [] : structured.instructorAssistance;
  const narrativeRecap = containsParticipantReference(structured.narrativeRecap) ? "" : structured.narrativeRecap;
  const wentWell = structured.wentWell.filter((s) => !containsParticipantReference(s));
  const needsWork = structured.needsWork.filter((s) => !containsParticipantReference(s));
  const actionItems = structured.actionItems.filter((s) => !containsParticipantReference(s));
  const nextLessonFocus = structured.nextLessonFocus.filter((s) => !containsParticipantReference(s));
  // The cue and its context label are a pair -- dropping one without the
  // other leaves an orphaned label with nothing to describe.
  const cueViolates = containsParticipantReference(structured.nextFlightCue);

  return {
    ...structured,
    instructorGuidance,
    instructorAssistance,
    narrativeRecap,
    wentWell,
    needsWork,
    actionItems,
    nextLessonFocus,
    nextFlightCue: cueViolates ? "" : structured.nextFlightCue,
    nextFlightCueContext: cueViolates ? "" : structured.nextFlightCueContext,
  };
}
