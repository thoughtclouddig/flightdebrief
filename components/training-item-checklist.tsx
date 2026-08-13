"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrainingItem } from "@/lib/types";

export function TrainingItemChecklist({ items }: { items: TrainingItem[] }) {
  const router = useRouter();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  async function toggle(item: TrainingItem) {
    setPendingIds((prev) => new Set(prev).add(item.id));
    await fetch(`/api/training-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !item.done }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const pending = pendingIds.has(item.id);
        return (
          <li key={item.id} className="flex items-start gap-2.5 text-sm">
            <button
              onClick={() => toggle(item)}
              disabled={pending}
              aria-label={item.done ? "Mark not done" : "Mark done"}
              className={cn(
                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors disabled:opacity-60",
                item.done ? "border-brand bg-brand" : "border-hairline bg-surface hover:border-brand",
              )}
            >
              {item.done ? <Check className="size-3 text-white" strokeWidth={3} /> : null}
            </button>
            <span className={cn("text-foreground-soft", item.done && "text-foreground-faint line-through")}>
              {item.description}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
