function titleCase(s: string) {
  return s.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** A title reads as a *focus*, not a table of contents, past this many distinct segments -- see the doc comment below. */
const MAX_FOCUS_SEGMENTS = 2;

/**
 * Turns a flight's real objectives into the natural phrase a lesson title
 * would use -- "Crosswind + Short-Field Landings," not a literal
 * "Crosswind landings + Landings + Short-field landings" concatenation of
 * every flight_tasks.label. Tasks sharing a trailing "landing[s]" word (the
 * common case in this taxonomy -- Crosswind/Short-Field/Soft-Field Landing)
 * combine into one shared-suffix phrase; a bare "Landings" task (Stabilized
 * Approach's own catalog label, see lib/topics.ts) has no maneuver-specific
 * prefix and contributes nothing rather than an empty segment. Anything else
 * joins as its own segment.
 *
 * Capped at MAX_FOCUS_SEGMENTS: past a couple of segments this stops being a
 * *focus* and becomes every objective run together into one sentence -- a
 * real Staging flight with six freeform-selected objectives (Weather &
 * Go/No-Go Decision + Preflight Inspection + Slow Flight + ...) rendered as
 * a giant, absurd page heading before this cap existed. Every caller already
 * has a real, non-fabricated fallback for the null case (the flight's own
 * route, or a generic label) -- see confirm/page.tsx and its siblings -- so
 * returning null here for a genuinely long objective list is the honest
 * choice, not a degraded one: there is no single "focus" to name.
 *
 * A freeform-mode flight can have flight_tasks now too (the student
 * self-selects them at /confirm, same as guided/light) -- this function has
 * no guidance-mode awareness of its own and was never meant to; it only
 * describes whatever real task list it's given.
 */
export function deriveLessonFocus(tasks: { label: string; sortOrder: number }[]): string | null {
  const ordered = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);
  const landingPrefixes: string[] = [];
  const otherSegments: string[] = [];
  for (const t of ordered) {
    const match = t.label.trim().match(/^(.*?)\s*landings?$/i);
    const prefix = match?.[1]?.trim();
    if (prefix) landingPrefixes.push(titleCase(prefix));
    else if (!match) otherSegments.push(titleCase(t.label));
  }
  const segments = [landingPrefixes.length > 0 ? `${landingPrefixes.join(" + ")} Landings` : null, ...otherSegments].filter(
    (s): s is string => Boolean(s),
  );
  if (segments.length === 0 || segments.length > MAX_FOCUS_SEGMENTS) return null;
  return segments.join(" + ");
}
