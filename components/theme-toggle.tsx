"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "afterflight-theme";

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
        "flex shrink-0 items-center justify-center rounded-full transition-colors",
        compact
          ? "size-11 text-foreground-faint hover:text-foreground"
          : "size-9 border border-hairline bg-surface text-foreground-soft hover:bg-surface-sunken",
      )}
    >
      <Sun className={compact ? "hidden size-[22px] dark:block" : "hidden size-4 dark:block"} />
      <Moon className={compact ? "size-[22px] dark:hidden" : "size-4 dark:hidden"} />
    </button>
  );
}
