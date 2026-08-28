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

export interface ArticleSubsection {
  heading: string;
  body: string;
}

/** Two-column contrast: the useful distinction an article keeps circling. */
export interface ArticleComparison {
  leftLabel: string;
  left: string;
  rightLabel: string;
  right: string;
}

export interface ArticleSection {
  /** Phrased as the question a reader would actually ask, not a topic label. */
  heading: string;
  /** 100-200 words. Must stand alone if quoted with no surrounding context. */
  body: string;
  /**
   * A genuine ordered procedure, rendered as an <ol>. Only when order is
   * load-bearing -- a numbered list of unordered points is a paragraph
   * wearing a costume, and answer engines quote ordered lists as procedures.
   *
   * Optional, like tip and subsections: body_blocks is untyped JSON, and rows
   * written before these fields existed have none. Declaring them required
   * would be a claim about stored data that isn't true.
   */
  steps?: string[];
  /**
   * One aside from an instructor's point of view. Null far more often than
   * not: a tip that restates the section is noise, and a page where every
   * section has one has taught the reader to skip them.
   */
  tip?: string | null;
  /**
   * Breaks a long section up without a second H2. Kept separate from
   * sections because only H2s carry the one-question-per-heading pattern
   * that search and answer engines key off.
   */
  subsections?: ArticleSubsection[];
  /**
   * A sentence lifted verbatim from this section's own body, set large.
   *
   * Verbatim matters: a pull quote that paraphrases is new copy pretending to
   * be emphasis, and it makes the page longer rather than more scannable. The
   * generator drops any quote it can't find in the body.
   */
  pullQuote?: string | null;
  /** For the distinction a section turns on. Null unless there are two real sides. */
  comparison?: ArticleComparison | null;
  /** Things to do or check, unordered. Distinct from steps, which are sequential. */
  checklist?: string[];
  /** A section-level image, with a caption that says something the body doesn't. */
  image?: { url: string; caption: string } | null;
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
  for (const section of body.sections) {
    parts.push(`${section.heading}\n\n${section.body}`);
    if (section.steps?.length) parts.push(section.steps.map((step, i) => `${i + 1}. ${step}`).join("\n"));
    if (section.tip) parts.push(section.tip);
    if (section.checklist?.length) parts.push(section.checklist.join("\n"));
    if (section.comparison) {
      const c = section.comparison;
      parts.push(`${c.leftLabel}: ${c.left}\n${c.rightLabel}: ${c.right}`);
    }
    // pullQuote is deliberately not included: it's a verbatim repeat of body
    // text, and doubling it would skew excerpts and read time.
    for (const sub of section.subsections ?? []) parts.push(`${sub.heading}\n\n${sub.body}`);
  }
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
