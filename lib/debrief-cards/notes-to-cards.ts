import type { StudentNote } from "@/lib/types";
import type { DebriefCardDraft } from "./generate";

const MAX_NOTE_CARDS = 2;

/**
 * Turns a CFI's open standing notes (see db/schema.sql's student_notes) into
 * guaranteed debrief cards -- pure function, no DB access, so it's testable
 * in isolation. Capped at the 2 oldest open notes so a backlog of notes
 * doesn't crowd out the rest of a debrief; appended on top of
 * generateDebriefCards' own MAX_CARDS-capped output (not counted against
 * that cap) since a CFI-authored note is guaranteed content, not a candidate
 * competing with generated ones.
 *
 * Reuses the "instructor_selected" source -- the same value already used for
 * cards a CFI adds live during a recording (see
 * app/api/flights/[id]/debrief/cards/route.ts) -- rather than adding a new
 * schema CHECK value for what is semantically the same thing: CFI-authored
 * content, just added at a different time.
 */
export function notesToCardDrafts(
  notes: StudentNote[],
  startSortOrder: number,
): { draft: DebriefCardDraft; noteId: string }[] {
  const oldest = [...notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(0, MAX_NOTE_CARDS);

  return oldest.map((note, i) => ({
    noteId: note.id,
    draft: {
      cardDefinitionId: null,
      flightTaskId: null,
      source: "instructor_selected",
      category: "IMPROVEMENT",
      title: "From your CFI",
      primaryPrompt: note.description,
      followUpPrompts: [],
      acsArea: null,
      acsAreaUrl: null,
      studentRating: null,
      instructorRating: null,
      discrepancyStatus: "none",
      sortOrder: startSortOrder + i,
      status: "pending",
      flaggedForFollowUp: false,
      recordingStartSeconds: null,
      recordingEndSeconds: null,
    },
  }));
}
