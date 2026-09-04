export type SkillState = "Needs Work" | "Improving" | "Meets Standard";

/**
 * State color lives here and nowhere else.
 *
 * Moved out of components/student/ui.tsx (a "use client" file) because a
 * plain data-mapping function has no reason to force every caller into the
 * client graph. components/student/debrief/assessment-comparison.tsx already
 * carries a comment explaining exactly this trap: calling a function
 * imported from a "use client" file inside a Server Component throws
 * "Attempted to call stateTone() from the server" at request time, not at
 * build time -- ui.tsx's own Client Components (SkillMeter, StateLabel,
 * TrendStrip) are still fine to *render as JSX* from a Server Component,
 * since that's the actually-supported RSC pattern; only *calling the plain
 * function* from server code was ever broken.
 *
 * Two variants per state, because contrast is a property of the pair and not
 * of the color: the bright greens/golds clear 4.5:1 on the navy panel and sit
 * around 2.2:1 on paper, and the deep versions do the exact reverse. Passing
 * `onPanel` is not a stylistic choice -- getting it wrong is an AA failure.
 */
export function stateTone(state: SkillState, onPanel = false) {
  if (onPanel) {
    return state === "Meets Standard"
      ? { text: "text-state-good-on-panel", fill: "bg-state-good-on-panel", track: "bg-panel-hairline" }
      : state === "Improving"
        ? { text: "text-state-improving-on-panel", fill: "bg-state-improving-on-panel", track: "bg-panel-hairline" }
        : { text: "text-state-attention-on-panel", fill: "bg-state-attention-on-panel", track: "bg-panel-hairline" };
  }
  return state === "Meets Standard"
    ? { text: "text-state-good", fill: "bg-state-good", track: "bg-hairline" }
    : state === "Improving"
      ? { text: "text-state-improving", fill: "bg-state-improving", track: "bg-hairline" }
      : { text: "text-state-attention", fill: "bg-state-attention-fill", track: "bg-hairline" };
}
