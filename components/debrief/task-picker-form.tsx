"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TrainingSkill } from "@/lib/types";

export function TaskPickerForm({
  flightId,
  allSkills,
  initialSelected,
  redirectTo,
}: {
  flightId: string;
  allSkills: { skill: TrainingSkill; label: string }[];
  initialSelected: TrainingSkill[];
  redirectTo: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<TrainingSkill>>(new Set(initialSelected));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(skill: TrainingSkill) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/flights/${flightId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskCodes: [...selected] }),
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
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <Button size="lg" onClick={submit} disabled={selected.size === 0 || submitting}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Continue ({selected.size} selected)
      </Button>
    </div>
  );
}
