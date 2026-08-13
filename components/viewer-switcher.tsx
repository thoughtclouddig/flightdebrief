"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { VIEWER_OPTIONS } from "@/lib/viewer-options";
import type { Viewer } from "@/lib/viewer-options";

const HOME_BY_ROLE: Record<Viewer["role"], string> = {
  student: "/home",
  instructor: "/cfi/today",
  admin: "/admin/overview",
};

export function ViewerSwitcher({ viewer, compact = false }: { viewer: Viewer; compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  async function switchTo(option: (typeof VIEWER_OPTIONS)[number]) {
    setOpen(false);
    await fetch("/api/viewer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(option),
    });
    startTransition(() => {
      router.push(HOME_BY_ROLE[option.role]);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className={cn(
          "flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-60 dark:border-white/15 dark:bg-slate-900 dark:text-slate-200",
          compact && "px-2.5 py-1",
        )}
      >
        <span className={cn("max-w-[9rem] truncate", compact && "max-w-[6rem]")}>
          {viewer.user.name}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-slate-400" />
      </button>

      {open ? (
        <>
          <button
            aria-label="Close"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-slate-900">
            <p className="px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Viewing as (demo)
            </p>
            {VIEWER_OPTIONS.map((option) => (
              <button
                key={`${option.userId}-${option.role}`}
                onClick={() => switchTo(option)}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5",
                  viewer.user.id === option.userId && viewer.role === option.role
                    ? "font-semibold text-brand-dark dark:text-brand-light"
                    : "",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
