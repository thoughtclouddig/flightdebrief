"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "flightbrief-theme";

function toggleTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const next = isDark ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(STORAGE_KEY, next);
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle light/dark mode"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-hairline bg-surface text-foreground-soft transition-colors hover:bg-surface-sunken",
        compact ? "size-8" : "size-9",
      )}
    >
      <Sun className="hidden size-4 dark:block" />
      <Moon className="size-4 dark:hidden" />
    </button>
  );
}
