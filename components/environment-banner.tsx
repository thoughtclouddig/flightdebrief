import { connection } from "next/server";
import { resolveEnvironmentBanner } from "@/lib/build-info";

/**
 * Thin, non-floating strip identifying a non-production build -- replaces
 * the earlier fixed-position lower-right badge, which visual review
 * rejected for sitting over the bottom nav. This is diagnostic/QA chrome
 * only, never product UI: mounted once in app/layout.tsx, above
 * `{children}`, so it participates in the root `<body>`'s own flex column
 * as a normal, non-fixed, non-overlapping layout item -- it pushes every
 * route's own header down by its own height rather than floating on top
 * of anything. Every route tree (canonical Student, Student V2, CFI V2,
 * School V2) gets it for free from this one insertion point; none of
 * their own layouts need to know it exists.
 *
 * The safe-area spacer is a separate sibling div, not padding folded into
 * the content row's own height -- same pattern components/student/
 * bottom-nav.tsx already uses for its own bottom safe area, so a real
 * notch/dynamic-island grows the total space reserved without stretching
 * the ~18-20px content row itself out of its intended size.
 *
 * `await connection()` before reading the environment is load-bearing, not
 * decoration: this component sits in the root layout, so without it
 * getAppEnv()'s result can get captured once -- whenever this module is
 * first evaluated on a given server process -- and reused for every request
 * that process ever serves afterward, including ones where the real
 * environment has since resolved differently. connection() defers rendering
 * to true request time, matching what generateMetadata's own ENV_TAG
 * (app/layout.tsx) now relies on this same component for -- see that file's
 * comment for the full incident this fixes.
 */
export async function EnvironmentBanner() {
  await connection();
  const banner = resolveEnvironmentBanner();
  if (!banner) return null;

  return (
    <div className="shrink-0">
      <div className="h-[env(safe-area-inset-top)]" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="flex h-[18px] items-center justify-center bg-black/70 font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-white/70 dark:bg-white/10 dark:text-white/60"
      >
        {banner.label}
        {banner.sha ? ` · ${banner.sha}` : ""}
      </div>
    </div>
  );
}
