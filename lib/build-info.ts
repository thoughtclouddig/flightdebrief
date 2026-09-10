import { getAppEnv } from "./env";
import { BUILD_SHA } from "./build-info.generated";

export interface BuildBadgeInfo {
  /** "DEV" or "STAGING" -- production never gets a badge at all (see resolveBuildBadge). */
  label: string;
  /** Short git SHA captured at dev/build time, or null if it couldn't be resolved (see scripts/write-build-sha.mjs). */
  sha: string | null;
}

/**
 * What the runtime build/environment badge (components/build-env-badge.tsx)
 * shows, if it shows at all -- kept as a pure function, separate from the
 * component, so the decision is cheaply testable without rendering
 * anything. This is operational verification chrome only, not a product
 * feature: it exists so a screenshot can prove exactly which build a
 * viewer was looking at.
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
export function resolveBuildBadge(): BuildBadgeInfo | null {
  const env = getAppEnv();
  if (env === "production") return null;
  return { label: env === "development" ? "DEV" : "STAGING", sha: BUILD_SHA };
}
