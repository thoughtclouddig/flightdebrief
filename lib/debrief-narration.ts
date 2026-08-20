import { speakList } from "@/lib/narration";
import type { InstructorGuidance, StudyReference } from "@/lib/types";

/**
 * Turns a completed debrief's structured result into a short spoken script
 * (see app/api/flights/[id]/debrief/audio/route.ts) -- for listening back to
 * what happened, e.g. driving home after the lesson. Prose, not a readout of
 * the on-screen bullet lists -- same rationale as lib/next-lesson-narration.ts.
 */
export interface DebriefNarrationInput {
  studentFirstName: string;
  whatWeDid: string[];
  wentWell: string[];
  needsWork: string[];
  instructorGuidance: InstructorGuidance[];
  actionItems: string[];
  studyReferences: StudyReference[];
  nextLessonFocus: string[];
}

export function buildDebriefNarration(input: DebriefNarrationInput): string {
  const lines: string[] = [`Hey ${input.studentFirstName}, here's your debrief -- let's walk through today's flight together.`];

  if (input.whatWeDid.length > 0) {
    lines.push(`Today you worked on ${speakList(input.whatWeDid)}.`);
  }

  if (input.wentWell.length > 0) {
    lines.push(`What went well: ${speakList(input.wentWell)}.`);
  }

  if (input.needsWork.length > 0) {
    lines.push(`What needs work: ${speakList(input.needsWork)}.`);
  }

  for (const g of input.instructorGuidance) {
    lines.push(`${g.instructorName} said: ${g.quote}`);
  }

  if (input.actionItems.length > 0) {
    lines.push(`Before your next flight: ${speakList(input.actionItems)}.`);
  }

  if (input.studyReferences.length > 0) {
    lines.push("Take a look at the study resources below to dig deeper into today's topics.");
  }

  // Dynamic, specific close (what's actually next) rather than generic
  // praise -- ends on efficacy and a concrete next step, not just cheering.
  lines.push(
    input.nextLessonFocus.length > 0
      ? `That's real progress from where you started. Keep chipping away at ${speakList(input.nextLessonFocus)}, and you'll feel the difference next flight.`
      : "That's real progress from where you started. Keep it up, and you'll feel the difference next flight.",
  );

  return lines.join(" ");
}
