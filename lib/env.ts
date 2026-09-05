/**
 * The one place the application decides which of three environments it is
 * running in. Everything that needs to tell dev/staging/production apart --
 * proxy.ts's /v2 guard, the prototype Vector API guard -- reads this instead
 * of inventing its own process.env check.
 *
 * APP_ENV is the source of truth when set. REPLIT_DEPLOYMENT (set by the
 * Replit platform itself, present today at ~10 call sites across this repo)
 * is a secondary signal used only when APP_ENV is absent.
 *
 * Fail-safe rule: a deployed runtime (REPLIT_DEPLOYMENT set) with no explicit
 * APP_ENV is production, not development -- staging does not exist as its own
 * deployment yet, so the only way to be staging is to say so explicitly.
 * Nothing here should ever resolve an ambiguous deployed runtime to
 * development, since that would silently turn on dev-only surfaces.
 */
export type AppEnv = "development" | "staging" | "production";

export function getAppEnv(): AppEnv {
  const explicit = (process.env.APP_ENV ?? "").trim().toLowerCase();
  if (explicit === "development" || explicit === "staging" || explicit === "production") {
    return explicit;
  }
  return process.env.REPLIT_DEPLOYMENT ? "production" : "development";
}

export function isDevelopment(): boolean {
  return getAppEnv() === "development";
}

export function isStaging(): boolean {
  return getAppEnv() === "staging";
}

export function isProduction(): boolean {
  return getAppEnv() === "production";
}

/**
 * Staging /v2 baseline reversion (temporary product decision, not an
 * environment fact): staging must first reproduce the complete approved V2
 * fixture reference experience end-to-end -- Mia, Jake, every route, full
 * navigation, exactly like development -- before the real-data Home adapter
 * (lib/student/home-production-adapter.tsx) and the corresponding
 * fixture-nav disabling get turned back on deliberately. That code is not
 * deleted; every /v2 file that branches on this reads this one flag, so
 * resuming real-data productionization later is flipping this back to
 * `isStaging()`, not another multi-file change. Has no effect in
 * development (always fixture) or production (/v2 is blocked entirely
 * before anything reads this).
 */
export function v2StagingUsesRealData(): boolean {
  return false;
}
