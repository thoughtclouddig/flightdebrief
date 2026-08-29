import type { Source } from "@/lib/types";

/**
 * Whether an article may be published.
 *
 * An unsourced article is written from the model's training data and checked
 * by a fact-checker that has no search tools -- so it is verified against the
 * same memory that produced it. On the public page it looks identical to a
 * researched one: same layout, same byline, same authority. The only
 * difference is invisible to a reader, which makes it worse than no article.
 *
 * The staff preview already warns about this, but a warning works exactly as
 * long as someone reads it. This is the part that does not depend on that.
 *
 * Deliberately a publish-time check rather than a generation-time one: an
 * unsourced draft is still a useful starting point to add citations to by
 * hand. What must not happen is it reaching a reader unsourced.
 */
export function blocksPublish(sources: Source[] | undefined | null): string | null {
  if (sources && sources.length > 0) return null;
  return "This article has no sources. It was written without verified research, so every factual claim in it is unverified — and a reader cannot tell the difference. Redraft it, or add citations before publishing.";
}
