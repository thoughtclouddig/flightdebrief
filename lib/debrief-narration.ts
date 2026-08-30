import { speakList, toSecondPerson, readsAsSentence, stripSpokenActionLabel } from "@/lib/narration";
import type { InstructorGuidance, StudyReference } from "@/lib/types";

/**
 * Turns a completed debrief's structured result into a short spoken script
 * (see app/api/flights/[id]/debrief/audio/route.ts) -- for listening back to
 * what happened, e.g. driving home after the lesson. Prose, not a readout of
 * the on-screen bullet lists -- same rationale as lib/next-lesson-narration.ts.
 *
 * The CFI teaches; AfterFlight makes sure the lesson sticks. This script is
 * the "Digital Debriefer" voice, so it must never sound like it's
 * independently instructing/coaching/evaluating the student -- instructional
 * content (what to work on, what to do next) is attributed to the instructor
 * by first name when known, falling back to "your instructor" (never a
 * guessed name, never a guessed pronoun -- there's no gender data anywhere
 * in the schema). Ownership doesn't need repeating in every sentence once
 * it's established.
 */
export interface DebriefNarrationInput {
  studentFirstName: string;
  /** Resolved via lib/instructor-attribution.ts's resolveCfiFirstName(). Null when no instructor is assigned to this flight. */
  instructorFirstName: string | null;
  /**
   * True when this pilot flies without an instructor at all -- an individual
   * account rather than a student whose CFI simply is not named on this
   * flight. The two cases both leave instructorFirstName null and need
   * completely different narration.
   */
  soloPilot?: boolean;
  /**
   * Claude's own natural-language recap of the debrief (see lib/ai/prompt.ts),
   * grounded in the same fields below -- when present, this replaces the
   * templated middle section entirely so the audio sounds like a real recap
   * instead of a fixed bullet-by-bullet readout. Still framed by the same
   * personalized opening/closing, which stay deterministic (never AI text)
   * on purpose. Falls back to the template below when empty -- older
   * debriefs analyzed before this field existed, or a transcript too thin
   * for Claude to build a real narrative from.
   */
  narrativeRecap?: string;
  whatWeDid: string[];
  wentWell: string[];
  needsWork: string[];
  instructorGuidance: InstructorGuidance[];
  actionItems: string[];
  studyReferences: StudyReference[];
}

/** Instructor quotes read aloud. The rest stay on the results page. */
const MAX_SPOKEN_GUIDANCE = 4;

export function buildDebriefNarration(input: DebriefNarrationInput): string {
  const cfi = input.instructorFirstName;

  // Null instructorFirstName means two different things, and the old fallback
  // treated them as one: a STUDENT whose instructor is not named on this
  // flight -- "your instructor" is right for them -- and a SOLO pilot, who
  // has none. Saying "your instructor noted" to someone the product recruited
  // with "no CFI needed" describes a conversation that did not happen.
  //
  // A solo debrief is the pilot's own. So the lines are rewritten in their
  // voice rather than having a name removed from them.
  const solo = input.soloPilot === true;
  const cfiOrFallback = cfi ?? "your instructor";
  const cfiOrFallbackCapitalized = cfi ?? "Your instructor";
  const opening = `Hey ${input.studentFirstName}, here's your debrief -- let's walk through today's flight together.`;
  const closing = cfi
    ? `Overall, ${cfi} felt this was a good flight, and you're making progress. Keep chipping away, and fly safe.`
    : "Nice work today. Keep chipping away, and fly safe.";

  if (input.narrativeRecap?.trim()) {
    // Converted like everything else. This branch returns early and skips the
    // whole template below, so a fix applied field-by-field down there never
    // reached the one path that actually runs for most debriefs -- which is
    // why "Nina had me work on..." survived the first attempt at this.
    return [opening, toSecondPerson(input.narrativeRecap.trim()), closing].join("\n\n");
  }

  const sections: string[] = [opening];

  if (input.whatWeDid.length > 0) {
    sections.push(`Today you worked on ${speakList(input.whatWeDid.map(toSecondPerson))}.`);
  }

  if (input.wentWell.length > 0) {
    sections.push(
      solo
        ? `What went well: ${speakList(input.wentWell.map(toSecondPerson))}.`
        : `${cfiOrFallbackCapitalized} noted that ${speakList(input.wentWell.map(toSecondPerson))}.`,
    );
  }

  if (input.needsWork.length > 0) {
    sections.push(
      // Same shape problem as the brief's "Keep an eye on": "...was X" wants
      // a noun phrase, and needsWork items are often whole sentences.
      readsAsSentence(input.needsWork[0]!)
        ? `The biggest thing ${solo ? "you flagged" : `you and ${cfiOrFallback} identified`} during the debrief: ${toSecondPerson(input.needsWork[0]!)}`
        : `The biggest thing ${solo ? "you flagged" : `you and ${cfiOrFallback} identified`} during the debrief was ${toSecondPerson(input.needsWork[0]!)}.`,
    );
  }

  // Capped, and this is the field that made scripts long: it was the only one
  // read out verbatim with no limit, so a talkative lesson could put a dozen
  // quotes into the audio. Beyond the first few this stops being a recap and
  // becomes a transcript read aloud -- the full set is still on screen, where
  // skimming works. This also keeps most scripts inside one TTS request.
  for (const g of input.instructorGuidance.slice(0, MAX_SPOKEN_GUIDANCE)) {
    // "X said: <first-person quote>" put the student's own words in the
    // instructor's mouth when the quote came from the student's side of the
    // debrief. Attributing the point rather than the sentence is both more
    // accurate and better to listen to.
    sections.push(`${g.instructorName} pointed out: ${toSecondPerson(g.quote)}`);
  }

  if (input.actionItems.length > 0) {
    sections.push(
      solo
        // stripSpokenActionLabel: the item arrives labelled for the results
        // card ("Work on: ..."), and both frames here already say it.
        ? `For your next flight, you're focusing on ${stripSpokenActionLabel(toSecondPerson(input.actionItems[0]!))}.`
        : `For your next flight, ${cfiOrFallback} wants you to focus on ${stripSpokenActionLabel(toSecondPerson(input.actionItems[0]!))}.`,
    );
  }

  if (input.studyReferences.length > 0) {
    sections.push(
      solo
        ? "AfterFlight has also added a few study resources to your list, based on what came up in this debrief."
        : `AfterFlight has also added a few study resources to your list, based on what you and ${cfiOrFallback} discussed.`,
    );
  }

  // Short and generic on purpose -- the specifics were already said above,
  // so a close that repeated them again just restated the same content
  // twice in a row. Attributed once more when a name is known, since a
  // closing "felt good about the flight" line reads as an instructor's
  // assessment, not AfterFlight's own.
  sections.push(closing);

  // Blank line between sections (not a single space) -- most TTS engines
  // treat a paragraph break as a longer pause than a mid-sentence period,
  // which is what was making topic changes read as rushed/run-on.
  return sections.join("\n\n");
}
