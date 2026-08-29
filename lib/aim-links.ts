/**
 * Turns an AIM citation into a link to the paragraph's section.
 *
 * The scenario bank already carries citations like "AIM 4-1-13, Automatic
 * Terminal Information Service (ATIS)". Rendering that as plain text asks a
 * student to go find it, which nobody does mid-practice -- so a coaching note
 * that cites its authority ends up carrying none.
 *
 * The URL is derived from the paragraph number rather than kept in a lookup
 * table that would rot: AIM 4-1-13 lives in chapter 4, section 1. It links to
 * the section, not to a per-paragraph anchor -- the anchors exist but aren't
 * stable enough to guess, and a link that lands on the right page is worth
 * more than one that might 404.
 */
const AIM_BASE = "https://www.faa.gov/air_traffic/publications/atpubs/aim_html";

export function aimSectionUrl(source: string): string | null {
  // "AIM 4-1-13, ..." or "AIM 4-3-18, Taxiing; readback per 4-4-10, ..."
  const match = /AIM\s+(\d+)-(\d+)-\d+/i.exec(source);
  if (!match) return null;
  const [, chapter, section] = match;
  return `${AIM_BASE}/chap${chapter}_section_${section}.html`;
}
