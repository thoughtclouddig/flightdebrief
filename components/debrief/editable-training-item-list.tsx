"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrainingItem, TrainingItemCategory } from "@/lib/types";

/**
 * CFI-editable version of a training-item list -- edit wording, delete, or
 * add a new one, on top of whatever the transcript analysis already
 * generated. Distinct from TrainingItemChecklist (student-facing, check-off
 * only, no edit/delete since a student shouldn't be able to rewrite or
 * remove what their instructor flagged).
 */
export function EditableTrainingItemList({
  flightId,
  category,
  initialItems,
  addPlaceholder,
}: {
  flightId: string;
  category: TrainingItemCategory;
  initialItems: TrainingItem[];
  addPlaceholder: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [newDescription, setNewDescription] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addItem() {
    const description = newDescription.trim();
    if (!description) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch(`/api/flights/${flightId}/training-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, description }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to add.");
      setItems((prev) => [...prev, data.item]);
      setNewDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add.");
    } finally {
      setAdding(false);
    }
  }

  async function saveEdit(id: string, description: string) {
    const res = await fetch(`/api/training-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    if (!res.ok) return false;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, description } : i)));
    return true;
  }

  async function deleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/training-items/${id}`, { method: "DELETE" });
  }

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? <p className="text-sm text-foreground-faint">Nothing here yet.</p> : null}
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <EditableTrainingItemRow key={item.id} item={item} onSave={saveEdit} onDelete={deleteItem} />
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder={addPlaceholder}
          className="h-9 min-w-0 flex-1 rounded-lg border border-hairline bg-transparent px-3 text-sm"
        />
        <button
          type="button"
          onClick={addItem}
          disabled={adding || !newDescription.trim()}
          className={cn(
            "flex h-9 shrink-0 items-center gap-1 rounded-lg bg-brand px-3 text-sm font-medium text-white transition-colors disabled:opacity-50",
          )}
        >
          {adding ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          Add
        </button>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}

function EditableTrainingItemRow({
  item,
  onSave,
  onDelete,
}: {
  item: TrainingItem;
  onSave: (id: string, description: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.description);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function commit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === item.description) {
      setDraft(item.description);
      setEditing(false);
      return;
    }
    setSaving(true);
    const ok = await onSave(item.id, trimmed);
    setSaving(false);
    if (ok) setEditing(false);
  }

  if (editing) {
    return (
      <li className="flex items-center gap-2">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          className="h-9 min-w-0 flex-1 rounded-lg border border-brand bg-transparent px-3 text-sm"
        />
        <button
          type="button"
          onClick={commit}
          disabled={saving}
          aria-label="Save"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-good hover:bg-surface-sunken"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(item.description);
            setEditing(false);
          }}
          aria-label="Cancel"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground-faint hover:bg-surface-sunken"
        >
          <X className="size-4" />
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-2 text-sm text-foreground-soft">
      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
      <span className="min-w-0 flex-1">{item.description}</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Edit"
        className="shrink-0 rounded p-1 text-foreground-faint hover:bg-surface-sunken hover:text-foreground"
      >
        <Pencil className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => {
          setDeleting(true);
          onDelete(item.id);
        }}
        disabled={deleting}
        aria-label="Delete"
        className="shrink-0 rounded p-1 text-foreground-faint hover:bg-danger-soft hover:text-danger"
      >
        <Trash2 className="size-3.5" />
      </button>
    </li>
  );
}
