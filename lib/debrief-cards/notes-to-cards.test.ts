import { describe, expect, it } from "vitest";
import { notesToCardDrafts } from "./notes-to-cards";
import type { StudentNote } from "@/lib/types";

function note(id: string, description: string, createdAt: string): StudentNote {
  return { id, organizationId: "org-1", studentId: "user-1", authorUserId: "user-cfi", description, done: false, completedAt: null, createdAt };
}

describe("notesToCardDrafts", () => {
  it("produces no cards for an empty note list", () => {
    expect(notesToCardDrafts([], 0)).toEqual([]);
  });

  it("turns an open note into a guaranteed instructor_selected card", () => {
    const [result] = notesToCardDrafts([note("note-1", "Work on flare timing", "2026-08-01T00:00:00Z")], 3);
    expect(result.noteId).toBe("note-1");
    expect(result.draft.source).toBe("instructor_selected");
    expect(result.draft.category).toBe("IMPROVEMENT");
    expect(result.draft.primaryPrompt).toBe("Work on flare timing");
    expect(result.draft.sortOrder).toBe(3);
  });

  it("caps at the 2 oldest notes, ignoring newer ones", () => {
    const notes = [
      note("note-newest", "Newest", "2026-08-03T00:00:00Z"),
      note("note-oldest", "Oldest", "2026-08-01T00:00:00Z"),
      note("note-middle", "Middle", "2026-08-02T00:00:00Z"),
    ];
    const results = notesToCardDrafts(notes, 0);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.noteId)).toEqual(["note-oldest", "note-middle"]);
    expect(results.map((r) => r.draft.sortOrder)).toEqual([0, 1]);
  });
});
