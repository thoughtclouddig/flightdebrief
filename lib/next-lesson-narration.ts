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
  lines.push(`Hi ${input.studentFirstName}, here's your brief before today's flight.`);

  if (input.whatWeDid.length > 0) {
    lines.push(`Last time, on ${dateLabel}, you worked on ${speakList(input.whatWeDid)}.`);
  }

  if (input.keepWorkingOn.length > 0) {
    lines.push(`Your instructor wants you to keep working on ${speakList(input.keepWorkingOn)}.`);
  }

  if (input.beforeToday.length > 0) {
    lines.push(`Before you fly today: ${speakList(input.beforeToday)}.`);
  }

  if (input.focus.length > 0) {
    lines.push(`Today's focus is ${speakList(input.focus)}.`);
  }

  lines.push("Good luck out there.");

  return lines.join(" ");
}
