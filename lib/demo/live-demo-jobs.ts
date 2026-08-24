/** Carries the persona-specific onboarding line (see LiveDemoResult.hint in lib/demo/live-demo-seed.ts) to app/(product)/layout.tsx, which renders it in LiveDemoBanner. Lives in its own module since both app/api/demo/start/route.ts and that layout need it. */
export const DEMO_HINT_COOKIE = "fb_demo_hint";
