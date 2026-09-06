"use client";

import { ThemeToggle } from "@/components/prototype/theme-toggle";

/**
 * Milestone CFI-V2-1's whole header action set: appearance only. Profile is
 * a nav tab (not a header icon, unlike Student's account avatar), and this
 * milestone deliberately doesn't build a real Profile screen yet -- see
 * app/cfi-v2/profile/page.tsx.
 */
export function CfiV2HeaderActions() {
  return <ThemeToggle />;
}
