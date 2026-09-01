"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useStored } from "@/lib/prototype/use-stored";

type Theme = "light" | "dark";

/**
 * Explicit light/dark switch.
 *
 * The tokens already supported both, but the only way to see dark mode was to
 * change the operating system -- which meant nobody reviewing this ever did.
 * Writing data-theme on the root element is what app/globals.css's `dark`
 * variant keys off, so this drives every token at once rather than restyling
 * anything itself.
 *
 * Starts unset rather than defaulting to light: until the user chooses, the
 * OS preference should win, and stamping an attribute on mount would override
 * it. The icon shows what a tap will DO, not what is currently on.
 */
export function ThemeToggle() {
  const [stored, setStored] = useStored("af-prototype-theme");
  const theme = stored === "light" || stored === "dark" ? (stored as Theme) : null;

  // Reflecting the stored choice onto the document is a side effect on the
  // DOM, not on React state -- it belongs in an effect, and re-runs whenever
  // the stored value changes rather than only on mount.
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
  }, [theme]);

  function toggle() {
    const current: Theme =
      theme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setStored(current === "dark" ? "light" : "dark");
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="flex size-11 cursor-pointer items-center justify-center rounded-full text-foreground-faint transition-colors hover:text-foreground"
    >
      {/* Both icons render; CSS picks one, so the control is correct before
          hydration and when the choice is still the OS's. */}
      <Sun className="hidden size-[22px] dark:block" strokeWidth={2} aria-hidden />
      <Moon className="size-[22px] dark:hidden" strokeWidth={2} aria-hidden />
    </button>
  );
}
