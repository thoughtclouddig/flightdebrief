"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrainingItem } from "@/lib/types";

export function TrainingItemChecklist({ items }: { items: TrainingItem[] }) {
  const router = useRouter();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [optimisticDone, setOptimisticDone] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();
  // Synchronous guard -- state updates aren't visible to the DOM until the
  // next render, so a second real-world click can land before `disabled`
  // takes effect. A ref check closes that gap.
  const inFlight = useRef<Set<string>>(new Set());

  async function toggle(item: TrainingItem) {
    if (inFlight.current.has(item.id)) return;
    inFlight.current.add(item.id);
    setPendingIds((prev) => new Set(prev).add(item.id));
    setOptimisticDone((prev) => ({ ...prev, [item.id]: !item.done }));
    try {
      await fetch(`/api/training-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !item.done }),
      });
    } finally {
      inFlight.current.delete(item.id);
      startTransition(() => router.refresh());
    }
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const pending = pendingIds.has(item.id);
        const done = optimisticDone[item.id] ?? item.done;
        return (
          <li key={item.id} className="flex items-start gap-2.5 text-sm">
            <button
              onClick={() => toggle(item)}
              disabled={pending}
              aria-label={done ? "Mark not done" : "Mark done"}
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors disabled:cursor-wait",
                done ? "border-brand bg-brand" : "border-hairline bg-surface hover:border-brand",
              )}
            >
              {pending ? (
                <Loader2 className={cn("size-3 animate-spin", done ? "text-white" : "text-foreground-faint")} />
              ) : done ? (
                <Check className="size-3.5 text-white" strokeWidth={3} />
              ) : null}
            </button>
            <span className={cn("text-foreground-soft", done && "text-foreground-faint line-through")}>
              {item.description}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
