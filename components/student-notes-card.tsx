"use client";

import { useState } from "react";
import { Loader2, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudentNote } from "@/lib/types";

/**
 * CFI-authored standing notes about a student -- addable any time, not tied
 * to a flight. Open notes automatically become guaranteed debrief cards next
 * time this student debriefs (see lib/debrief-cards/notes-to-cards.ts) and
 * get marked done then, not from this UI -- so there's no manual "mark done"
 * control here, only add.
 */
export function StudentNotesCard({ studentId, initialNotes }: { studentId: string; initialNotes: StudentNote[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openNotes = notes.filter((n) => !n.done);
  const resolvedNotes = notes.filter((n) => n.done);

  async function addNote() {
    if (!description.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${studentId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to add note.");
      setNotes((prev) => [...prev, data.note]);
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <NotebookPen className="size-4 text-brand" />
          Notes for Next Debrief
        </CardTitle>
        <CardDescription>Anything you jot down here gets brought up automatically next time you debrief this student.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex gap-2">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addNote()}
            placeholder="Something to bring up next time..."
            className="min-h-11 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-white/10"
          />
          <Button size="sm" onClick={addNote} disabled={saving || !description.trim()}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Add"}
          </Button>
        </div>
        {error ? <p className="text-xs text-danger">{error}</p> : null}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Open ({openNotes.length})</p>
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {openNotes.map((note) => (
              <li key={note.id} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                <span className="flex-1">{note.description}</span>
              </li>
            ))}
            {openNotes.length === 0 ? <p className="text-sm text-slate-400">Nothing queued.</p> : null}
          </ul>
        </div>
        {resolvedNotes.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Queued for a debrief ({resolvedNotes.length})
            </p>
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {resolvedNotes.map((note) => (
                <li key={note.id} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-slate-300" />
                  <span>{note.description}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
