"use client";

/**
 * Conversion events the marketing site fires. No analytics vendor is wired
 * up yet (none exists anywhere in this codebase) -- this is deliberately a
 * safe no-op (console-logged in dev only) so call sites don't need to
 * change when a real provider (GA4/PostHog/Plausible/etc.) is chosen later.
 */
export type MarketingEvent =
  | "start_free"
  | "watch_overview_video"
  | "view_pricing"
  | "select_pilot"
  | "select_cfi"
  | "select_school_pro"
  | "select_enterprise"
  | "audience_students"
  | "audience_cfis"
  | "audience_schools"
  | "audience_enterprise"
  | "login_click"
  | "flightscore_section_view";

export function trackEvent(event: MarketingEvent, props?: Record<string, string | number | boolean>) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[analytics] ${event}`, props ?? {});
  }
  // Wire to a real provider here once one is chosen, e.g.:
  // window.plausible?.(event, { props });
  // window.gtag?.("event", event, props);
}
