import { getAppEnv } from "./env";
import { BUILD_SHA } from "./build-info.generated";

export interface EnvironmentBannerInfo {
  /** "DEVELOPMENT" or "STAGING" -- production renders no banner at all (see resolveEnvironmentBanner). */
  label: string;
  /** Short git SHA captured at dev/build time, or null if it couldn't be resolved (see scripts/write-build-sha.mjs). */
  sha: string | null;
}

/**
 * What the runtime environment banner (components/environment-banner.tsx)
 * shows, if it shows at all -- kept as a pure function, separate from the
 * component, so the decision is cheaply testable without rendering
 * anything. This is operational verification chrome only, not a product
 * feature: it exists so a screenshot -- or just glancing at the page --
 * can prove exactly which build/environment was being viewed.
 *
 * No environment in this repo (Development, Staging, or Production Replit
 * deployments) exposes its own build/commit-SHA env var today -- confirmed
 * by inspecting .replit and every process.env read in this codebase before
 * adding anything new. BUILD_SHA instead comes from lib/build-info.
 * generated.ts, regenerated from a real `git rev-parse` immediately before
 * every dev/build/test run (see scripts/write-build-sha.mjs and package.
 * json's predev/prebuild/pretest hooks) -- the smallest build-time
 * mechanism that works in every environment that runs `npm run build`,
 * which is exactly how each Repl builds itself.
 */
export function resolveEnvironmentBanner(): EnvironmentBannerInfo | null {
  const env = getAppEnv();
  if (env === "production") return null;
  return { label: env === "development" ? "DEVELOPMENT" : "STAGING", sha: BUILD_SHA };
}

/**
 * The `[DEV] `/`[STAGING] ` browser-title prefix (app/layout.tsx's
 * generateMetadata) -- a separate pure function, not folded into
 * resolveEnvironmentBanner, so it stays trivially unit-testable without
 * rendering anything, the same reasoning that function's own doc comment
 * gives. Kept in this module (not app/layout.tsx itself) because that file
 * imports next/font/google, which needs the Next.js build pipeline to
 * resolve and can't be imported directly in a plain Vitest test.
 */
export function resolveTitlePrefix(): string {
  const env = getAppEnv();
  if (env === "development") return "[DEV] ";
  if (env === "staging") return "[STAGING] ";
  return "";
}
