"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The mockup's own, entirely local theme preview -- never the real
 * "afterflight-theme" localStorage key, never document.documentElement.
 * DesignThemeProvider owns the one .design-canvas element design-tokens.css
 * targets; "system" means "no data-theme attribute at all," which is what
 * lets that file's @media (prefers-color-scheme: dark) block do the work,
 * exactly mirroring how the real ThemeInitializer/globals.css pair behaves,
 * just scoped to this one subtree instead of the document root.
 */
type DesignThemePreference = "system" | "light" | "dark";

const DesignThemeContext = createContext<{
  preference: DesignThemePreference;
  setPreference: (p: DesignThemePreference) => void;
} | null>(null);

export function DesignThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<DesignThemePreference>("system");
  return (
    <div className="design-canvas min-h-dvh bg-[var(--dm-bg)] text-[var(--dm-text)]" data-theme={preference === "system" ? undefined : preference}>
      <DesignThemeContext.Provider value={{ preference, setPreference }}>{children}</DesignThemeContext.Provider>
    </div>
  );
}

const OPTIONS: { value: DesignThemePreference; label: string; icon: typeof Monitor }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

/** Development-only preview control -- not wired into the real Profile/theme toggle. */
export function DesignThemeSwitch() {
  const ctx = useContext(DesignThemeContext);
  if (!ctx) return null;
  const { preference, setPreference } = ctx;

  return (
    <div
      className="fixed right-3 top-3 z-40 flex items-center gap-0.5 rounded-full border border-[var(--dm-border)] bg-[var(--dm-surface)] p-1 shadow-[var(--dm-shadow)] md:right-5 md:top-5"
      role="tablist"
      aria-label="Preview theme (development only)"
    >
      {OPTIONS.map((o) => {
        const active = o.value === preference;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => setPreference(o.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-semibold transition-colors md:px-3",
              active ? "bg-[var(--dm-accent)] text-[var(--dm-on-accent)]" : "text-[var(--dm-text-soft)] hover:text-[var(--dm-text)]",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            <span className="hidden md:inline">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
