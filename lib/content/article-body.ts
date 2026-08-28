/**
 * Structured article body.
 *
 * Articles used to be one text column rendered by splitting on blank lines,
 * and the generator was told not to use headings at all. That shape is wrong
 * for both jobs the content has to do:
 *
 * - Search ranks sections and pulls featured snippets from them. A wall of
 *   paragraphs gives it nothing to rank but the page.
 * - Answer engines don't quote pages, they quote passages. An extracted chunk
 *   has to make sense with nothing around it, which is why every section here
 *   is required to stand alone -- no "as mentioned above", no dependency on
 *   what came before it.
 *
 * So the body is a small set of named parts rather than prose. The renderer
 * can then guarantee real <h2>s and correct FAQPage markup instead of hoping
 * a model formatted markdown properly, and the admin editor edits fields
 * rather than a wall of text.
 *
 * Stored in articles.body_blocks. articles.body keeps a flattened plain-text
 * copy so older articles keep rendering and excerpts/search have something
 * simple to read -- see toPlainText().
 */

export interface ArticleSection {
  /** Phrased as the question a reader would actually ask, not a topic label. */
  heading: string;
  /** 100-200 words. Must stand alone if quoted with no surrounding context. */
  body: string;
}

export interface ArticleFaq {
  question: string;
  /** 40-80 words. One self-contained answer. */
  answer: string;
}

export interface ArticleBody {
  /**
   * 40-60 words answering the title completely, with no preamble. The single
   * most-quoted element on the page -- an answer engine lifts this verbatim,
   * so it can't open with "it depends" or restate the question.
   */
  answer: string;
  /** 3-5 concrete lines, ideally with numbers. "It varies" never gets cited. */
  keyFacts: string[];
  sections: ArticleSection[];
  /** Rendered as FAQPage structured data as well as visible content. */
  faq: ArticleFaq[];
}

/**
 * Flattens a structured body to plain text, for articles.body -- excerpts,
 * search, and any consumer that predates the structure.
 */
export function toPlainText(body: ArticleBody): string {
  const parts: string[] = [body.answer];
  if (body.keyFacts.length > 0) parts.push(body.keyFacts.join("\n"));
  for (const section of body.sections) parts.push(`${section.heading}\n\n${section.body}`);
  for (const item of body.faq) parts.push(`${item.question}\n\n${item.answer}`);
  return parts.filter((p) => p.trim()).join("\n\n");
}

/**
 * True when an article has real structure to render. Older articles have only
 * the flat body, and there's no way to invent sections for them after the
 * fact -- the renderer falls back to paragraphs rather than guessing.
 */
export function hasStructuredBody(body: ArticleBody | null): body is ArticleBody {
  return body != null && body.answer.trim().length > 0 && body.sections.length > 0;
}
