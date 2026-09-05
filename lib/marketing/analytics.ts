"use client";

export type MarketingEvent =
  | "start_free"
  | "watch_overview_video"
  | "live_demo_pilot"
  | "live_demo_cfi"
  | "live_demo_school"
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

export type ProductEvent =
  | "onboarding_completed"
  | "flight_created"
  | "debrief_started"
  | "debrief_completed"
  | "radio_practice_started"
  | "radio_practice_submitted"
  | "checkout_started";

export type AnalyticsEvent = MarketingEvent | ProductEvent;
export type AnalyticsData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track(name: string, data?: AnalyticsData): void;
    };
  }
}

export function trackEvent(event: AnalyticsEvent, data?: AnalyticsData): void {
  if (typeof window === "undefined") return;

  try {
    window.umami?.track(event, data);
  } catch {
    // Analytics failures must never interrupt the user flow.
  }
}
