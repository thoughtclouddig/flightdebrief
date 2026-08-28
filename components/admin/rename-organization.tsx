"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Inline rename for the organization name shown on the settings page.
 *
 * The name was previously fixed at signup forever, and it isn't private --
 * it's the subject of every invite email ("You're invited to X"), so a typo
 * or a placeholder like "Bob Eagle's Flight School" followed every person
 * they ever invited.
 */
export function RenameOrganization({ name, label }: { name: string; label: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter a name.");
      return;
    }
    if (trimmed === name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Couldn't save the new name.");
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the new name.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="mt-1 flex items-center gap-2">
        <p className="text-lg font-medium text-foreground">{name}</p>
        <button
          type="button"
          aria-label={`Rename ${label}`}
          onClick={() => setEditing(true)}
          className="rounded-md p-1 text-foreground-faint transition-colors hover:bg-surface-sunken hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-1.5 flex flex-col gap-2">
      <Input
        value={value}
        maxLength={80}
        aria-label={`${label} name`}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") {
            setValue(name);
            setError(null);
            setEditing(false);
          }
        }}
      />
      <p className="text-xs text-foreground-faint">
        This appears in invitation emails and anywhere your {label.toLowerCase()} is named.
      </p>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={saving}
          onClick={() => {
            setValue(name);
            setError(null);
            setEditing(false);
          }}
        >
          Cancel
        </Button>
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : "Save name"}
        </Button>
      </div>
    </div>
  );
}
