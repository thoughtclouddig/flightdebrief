function titleCase(s: string) {
  return s.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Turns a flight's real objectives into the natural phrase a lesson title
 * would use -- "Crosswind + Short-Field Landings," not a literal
 * "Crosswind landings + Landings + Short-field landings" concatenation of
 * every flight_tasks.label. Tasks sharing a trailing "landing[s]" word (the
 * common case in this taxonomy -- Crosswind/Short-Field/Soft-Field Landing)
 * combine into one shared-suffix phrase; a bare "Landings" task (Stabilized
 * Approach's own catalog label, see lib/topics.ts) has no maneuver-specific
 * prefix and contributes nothing rather than an empty segment. Anything else
 * joins as its own segment. Only meaningful for a guided-mode debrief --
 * freeform debriefs have no flight_tasks at all, so this returns null and
 * the caller degrades rather than reaching for flight metadata instead.
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
  return segments.length > 0 ? segments.join(" + ") : null;
}
