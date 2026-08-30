/**
 * Headline formatting for article titles.
 *
 * Applied at render rather than at generation, deliberately: the model writes
 * a new headline every time and would have to be trusted to follow a style
 * rule on each one. A function applied on the way to the page cannot forget.
 */

/**
 * Words that stay lowercase in title case unless they start or end the line.
 * The conventional AP/Chicago set: articles, coordinating conjunctions, and
 * short prepositions.
 */
const MINOR_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "from", "if", "in", "into",
  "nor", "of", "off", "on", "onto", "or", "over", "per", "so", "the", "to",
  "up", "via", "vs", "with", "yet",
]);

/**
 * Title Case, the way a magazine sets a headline.
 *
 * Leaves a word alone when it is already mixed case or all caps -- "FAA",
 * "IFR", "PA-28" and "FlightScore" are correct as written, and capitalising
 * their first letter would be the only change while lowercasing the rest
 * would destroy them.
 */
export function toTitleCase(title: string): string {
  const words = title.trim().split(/\s+/);
  return words
    .map((word, i) => {
      // Already deliberate: an acronym, a type designation, a brand.
      if (/[A-Z]/.test(word.slice(1))) return word;

      const lower = word.toLowerCase();
      const isEdge = i === 0 || i === words.length - 1;
      if (!isEdge && MINOR_WORDS.has(lower.replace(/[^a-z]/g, ""))) return lower;

      // Capitalise after a hyphen too: "Go-Around", not "Go-around".
      return lower.replace(/(^|-)([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
    })
    .join(" ");
}

/**
 * Stop a headline ending in a single word on its own line.
 *
 * text-wrap: balance evens the lines out but does not forbid an orphan, and
 * on a narrow column it still happens. Binding the last two words with a
 * non-breaking space means the break can never fall between them, so the
 * final line carries at least two words.
 *
 * Left alone when the last word is long enough to hold a line by itself, or
 * when joining would make a pair too long to fit -- forcing a 30-character
 * pair onto one line causes overflow, which is worse than an orphan.
 */
export function preventOrphan(title: string, maxPairLength = 22): string {
  const words = title.trim().split(/\s+/);
  if (words.length < 3) return title.trim();

  const last = words[words.length - 1];
  const penultimate = words[words.length - 2];
  if (last.length + penultimate.length + 1 > maxPairLength) return title.trim();

  // Written as an escape rather than a literal: a non-breaking space is
  // invisible in source and the next person to edit this line would replace
  // it with an ordinary one without noticing.
  return [...words.slice(0, -2), `${penultimate}\u00A0${last}`].join(" ");
}

/** Both rules, in the order a headline wants them. */
export function formatHeadline(title: string): string {
  return preventOrphan(toTitleCase(title));
}
