import { speakList } from "@/lib/narration";
import type { InstructorGuidance, StudyReference } from "@/lib/types";

/**
 * Turns a completed debrief's structured result into a short spoken script
 * (see app/api/flights/[id]/debrief/audio/route.ts) -- for listening back to
 * what happened, e.g. driving home after the lesson. Prose, not a readout of
 * the on-screen bullet lists -- same rationale as lib/next-lesson-narration.ts.
 */
export interface DebriefNarrationInput {
  whatWeDid: string[];
  wentWell: string[];
  needsWork: string[];
  instructorGuidance: InstructorGuidance[];
  actionItems: string[];
  studyReferences: StudyReference[];
}

export function buildDebriefNarration(input: DebriefNarrationInput): string {
  const lines: string[] = ["Welcome to your debrief."];

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

  lines.push("Nice work today -- every flight like this one is building real skill. Keep it up, and fly safe.");

  return lines.join(" ");
}
