"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TrainingSkill } from "@/lib/types";

interface CustomEntry {
  taskCode: string;
  label: string;
}

export function TaskPickerForm({
  flightId,
  allSkills,
  initialTasks,
  redirectTo,
}: {
  flightId: string;
  allSkills: { skill: TrainingSkill; label: string }[];
  /** Every task already saved for this flight -- both catalog and custom, since a custom entry needs its label to render its tile. */
  initialTasks: { taskCode: string; label: string }[];
  redirectTo: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(initialTasks.map((t) => t.taskCode)));
  const [customEntries, setCustomEntries] = useState<CustomEntry[]>(
    initialTasks.filter((t) => !allSkills.some((s) => s.skill === t.taskCode)),
  );
  const [addingCustom, setAddingCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(taskCode: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(taskCode)) next.delete(taskCode);
      else next.add(taskCode);
      return next;
    });
  }

  function addCustom() {
    const label = customLabel.trim();
    if (!label) return;
    const taskCode = `CUSTOM:${crypto.randomUUID()}`;
    setCustomEntries((prev) => [...prev, { taskCode, label }]);
    setSelected((prev) => new Set(prev).add(taskCode));
    setCustomLabel("");
    setAddingCustom(false);
  }

  function removeCustom(taskCode: string) {
    setCustomEntries((prev) => prev.filter((c) => c.taskCode !== taskCode));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(taskCode);
      return next;
    });
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const labelByCode = new Map<string, string>([
        ...allSkills.map(({ skill, label }) => [skill, label] as const),
        ...customEntries.map(({ taskCode, label }) => [taskCode, label] as const),
      ]);
      const tasks = [...selected].map((taskCode) => ({ taskCode, label: labelByCode.get(taskCode) ?? taskCode }));

      const res = await fetch(`/api/flights/${flightId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
      });
      if (!res.ok) throw new Error();
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Couldn't save the task list -- check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {allSkills.map(({ skill, label }) => {
          const active = selected.has(skill);
          return (
            <button
              key={skill}
              type="button"
              onClick={() => toggle(skill)}
              className={cn(
                "rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors",
                active
                  ? "border-brand bg-brand/10 text-brand-dark dark:text-brand-light"
                  : "border-hairline bg-transparent text-foreground hover:bg-surface-sunken",
              )}
            >
              {label}
            </button>
          );
        })}
        {customEntries.map(({ taskCode, label }) => {
          const active = selected.has(taskCode);
          return (
            <div
              key={taskCode}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-brand bg-brand/10 text-brand-dark dark:text-brand-light"
                  : "border-hairline bg-transparent text-foreground hover:bg-surface-sunken",
              )}
            >
              <button type="button" onClick={() => toggle(taskCode)} className="flex-1 text-left">
                {label}
              </button>
              <button
                type="button"
                onClick={() => removeCustom(taskCode)}
                aria-label={`Remove ${label}`}
                className="shrink-0 rounded-full p-1 text-foreground-faint hover:bg-surface-sunken hover:text-danger"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {addingCustom ? (
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-hairline p-3 sm:flex-row sm:items-center">
          <input
            autoFocus
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder="e.g. Night landings, Checkride prep, Hood work"
            className="h-11 flex-1 rounded-lg border border-hairline bg-surface px-3 text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={addCustom} disabled={!customLabel.trim()}>
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAddingCustom(false);
                setCustomLabel("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingCustom(true)}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-hairline px-4 py-3 text-sm font-medium text-foreground-soft transition-colors hover:border-brand hover:text-brand"
        >
          <Plus className="size-4" />
          Add something not on this list
        </button>
      )}

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <Button size="lg" onClick={submit} disabled={selected.size === 0 || submitting}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Continue ({selected.size} selected)
      </Button>
    </div>
  );
}
