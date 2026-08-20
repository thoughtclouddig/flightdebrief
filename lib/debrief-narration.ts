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
}

export function buildDebriefNarration(input: DebriefNarrationInput): string {
  const sections: string[] = [`Hey ${input.studentFirstName}, here's your debrief -- let's walk through today's flight together.`];

  if (input.whatWeDid.length > 0) {
    sections.push(`Today you worked on ${speakList(input.whatWeDid)}.`);
  }

  if (input.wentWell.length > 0) {
    sections.push(`What went well: ${speakList(input.wentWell)}.`);
  }

  if (input.needsWork.length > 0) {
    sections.push(`What needs work: ${speakList(input.needsWork)}.`);
  }

  for (const g of input.instructorGuidance) {
    sections.push(`${g.instructorName} said: ${g.quote}`);
  }

  if (input.actionItems.length > 0) {
    sections.push(`Before your next flight: ${speakList(input.actionItems)}.`);
  }

  if (input.studyReferences.length > 0) {
    sections.push("Take a look at the study resources below to dig deeper into today's topics.");
  }

  // Short and generic on purpose -- the specifics (needs work, action items)
  // were already said above, so a close that repeated them again just
  // restated the same content twice in a row.
  sections.push("Nice work today. Keep chipping away, and fly safe.");

  // Blank line between sections (not a single space) -- most TTS engines
  // treat a paragraph break as a longer pause than a mid-sentence period,
  // which is what was making topic changes read as rushed/run-on.
  return sections.join("\n\n");
}
