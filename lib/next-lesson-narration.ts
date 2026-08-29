/**
 * Turns the Next-Lesson Brief's structured data into a short spoken script
 * for text-to-speech (see app/api/next-lesson/audio/route.ts) -- read aloud
 * for a hands-free pre-flight listen, e.g. driving to the airport. Deliberately
 * NOT a verbatim readout of the on-screen lists: a narrated brief needs
 * transitions and prioritization a bullet list doesn't, so this is authored
 * as prose rather than concatenating the same strings the page renders.
 *
 * Same CFI-attribution principle as lib/debrief-narration.ts: the focus for
 * today's flight is the instructor's guidance carried forward, not AfterFlight
 * independently telling the student what to do -- attribute it to the
 * instructor by first name when known, "your instructor" otherwise.
 */
import { speakList, toSecondPerson } from "@/lib/narration";

export interface NextLessonNarrationInput {
  studentFirstName: string;
  /** Resolved via lib/instructor-attribution.ts's resolveCfiFirstName(). Null when the last debriefed flight had no instructor assigned. */
  instructorFirstName: string | null;
  flightDate: string;
  whatWeDid: string[];
  keepWorkingOn: string[];
  beforeToday: string[];
  focus: string[];
}

export function buildNextLessonNarration(input: NextLessonNarrationInput): string {
  const lines: string[] = [];
  const cfiOrFallback = input.instructorFirstName ?? "your instructor";

  const dateLabel = new Date(input.flightDate + "T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  // Lead with the focus, not a status readout -- this is meant to be heard
  // once, driving to the airport, and land on "here's what today is about,"
  // not feel like a bullet list read aloud. The encouragement is specific to
  // what they're actually working on, not a generic sign-off.
  lines.push(`Hey ${input.studentFirstName}, quick brief before you fly.`);

  if (input.focus.length > 0) {
    lines.push(`${cfiOrFallback === "your instructor" ? "Your instructor" : cfiOrFallback} wants you to focus on ${speakList(input.focus.map(toSecondPerson))} today.`);
  }

  if (input.whatWeDid.length > 0) {
    lines.push(`Last time, on ${dateLabel}, you worked on ${speakList(input.whatWeDid.map(toSecondPerson))}, and that's carrying forward.`);
  }

  if (input.keepWorkingOn.length > 0) {
    lines.push(`Keep an eye on ${speakList(input.keepWorkingOn.map(toSecondPerson))} -- you're already making progress there.`);
  }

  if (input.beforeToday.length > 0) {
    lines.push(`One more thing before you go: ${speakList(input.beforeToday.map(toSecondPerson))}.`);
  }

  lines.push(
    input.focus.length > 0
      ? `You know what you're working on. Fly it deliberately, and you'll walk away better than you started.`
      : `You've prepared for this. Fly it deliberately, and you'll walk away better than you started.`,
  );

  return lines.join(" ");
}
