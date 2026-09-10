import { resolveBuildBadge } from "@/lib/build-info";

/**
 * Tiny fixed diagnostic marker -- operational verification only, never
 * product UI. Exists so a screenshot can prove exactly which build/
 * environment was being viewed. Mounted once in app/layout.tsx (the root
 * layout every route shares), so canonical Student, Student V2, CFI V2,
 * and School V2 all get it for free without three separate
 * implementations -- and never renders at all in Production (see
 * resolveBuildBadge).
 *
 * `pointer-events-none` is load-bearing, not decoration: it guarantees this
 * can never intercept a tap meant for bottom navigation or any button
 * underneath it, regardless of exact pixel position. Sized and worded to
 * read unmistakably as diagnostic chrome -- monospace, low-contrast
 * background, no pill/card treatment a real product surface would use.
 */
export function BuildEnvBadge() {
  const badge = resolveBuildBadge();
  if (!badge) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-[9999] select-none rounded bg-black/55 px-1.5 py-0.5 font-mono text-[9px] leading-none tracking-wide text-white/80 dark:bg-white/15 dark:text-white/70"
      style={{
        bottom: "max(0.25rem, env(safe-area-inset-bottom))",
        right: "max(0.25rem, env(safe-area-inset-right))",
      }}
    >
      {badge.label}
      {badge.sha ? ` · ${badge.sha}` : ""}
    </div>
  );
}
