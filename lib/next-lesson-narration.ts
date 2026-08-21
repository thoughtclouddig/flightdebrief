/**
 * Turns the Next-Lesson Brief's structured data into a short spoken script
 * for text-to-speech (see app/api/next-lesson/audio/route.ts) -- read aloud
 * for a hands-free pre-flight listen, e.g. driving to the airport. Deliberately
 * NOT a verbatim readout of the on-screen lists: a narrated brief needs
 * transitions and prioritization a bullet list doesn't, so this is authored
 * as prose rather than concatenating the same strings the page renders.
 */
import { speakList } from "@/lib/narration";

export interface NextLessonNarrationInput {
  studentFirstName: string;
  flightDate: string;
  whatWeDid: string[];
  keepWorkingOn: string[];
  beforeToday: string[];
  focus: string[];
}

export function buildNextLessonNarration(input: NextLessonNarrationInput): string {
  const lines: string[] = [];

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
    lines.push(`Today's about ${speakList(input.focus)} -- that's your main focus up there.`);
  }

  if (input.whatWeDid.length > 0) {
    lines.push(`Last time, on ${dateLabel}, you worked on ${speakList(input.whatWeDid)}, and that's carrying forward.`);
  }

  if (input.keepWorkingOn.length > 0) {
    lines.push(`Keep an eye on ${speakList(input.keepWorkingOn)} -- you're already making progress there.`);
  }

  if (input.beforeToday.length > 0) {
    lines.push(`One more thing before you go: ${speakList(input.beforeToday)}.`);
  }

  lines.push(
    input.focus.length > 0
      ? `You know what you're working on. Fly it deliberately, and you'll walk away better than you started.`
      : `You've prepared for this. Fly it deliberately, and you'll walk away better than you started.`,
  );

  return lines.join(" ");
}
