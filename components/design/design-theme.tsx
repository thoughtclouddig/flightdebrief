"use client";

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";
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
  /** "system" resolved against the OS's own preference -- consumers that
   * can't do this in CSS (e.g. picking between two logo SVG cuts) read
   * this instead of re-deriving it themselves. */
  resolvedTheme: "light" | "dark";
} | null>(null);

function subscribeToSystemScheme(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function DesignThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<DesignThemePreference>("system");
  // useSyncExternalStore, not a state+effect pair -- matchMedia is exactly
  // the external-store case that hook exists for, and it sidesteps the
  // "setState inside an effect" footgun a manual useEffect version would
  // have (an initial synchronous read plus a change listener). The server
  // snapshot is "light": there is no OS preference to read before hydration.
  const systemPrefersDark = useSyncExternalStore(
    subscribeToSystemScheme,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );

  const resolvedTheme: "light" | "dark" = preference === "system" ? (systemPrefersDark ? "dark" : "light") : preference;

  return (
    <div className="design-canvas min-h-dvh bg-[var(--dm-bg)] text-[var(--dm-text)]" data-theme={preference === "system" ? undefined : preference}>
      <DesignThemeContext.Provider value={{ preference, setPreference, resolvedTheme }}>{children}</DesignThemeContext.Provider>
    </div>
  );
}

export function useDesignTheme() {
  const ctx = useContext(DesignThemeContext);
  if (!ctx) throw new Error("useDesignTheme must be used within DesignThemeProvider");
  return ctx;
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
