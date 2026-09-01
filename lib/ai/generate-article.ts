import Anthropic from "@anthropic-ai/sdk";
import { ARTICLE_SYSTEM_PROMPT, buildArticleUserPrompt } from "./article-prompt";
import { generatedArticleSchema } from "./article-schema";
import { toPlainText, type ArticleBody } from "@/lib/content/article-body";
import { extractJson } from "./extract-json";
import { getRepository } from "@/lib/data";
import { slugify } from "@/lib/slugify";
import type { ArticleIdea, ResourceTopic, Source } from "@/lib/types";
import { reviewArticle, type EditorialNote } from "./editorial";
import { researchArticle, formatBrief, sourcesFrom, type ResearchBrief } from "./research";
import { toUsSpelling } from "@/lib/content/us-spelling";

/**
 * Picks the resource topic with the fewest existing articles, so daily
 * generation stays balanced across all topics without a separate
 * tracking/queue table.
 */
export async function pickNextTopic(): Promise<ResourceTopic> {
  const repo = getRepository();
  const [topics, articles] = await Promise.all([repo.listResourceTopics(), repo.listArticles({})]);
  if (topics.length === 0) throw new Error("No resource topics exist");

  const countByTopic = new Map<string, number>();
  for (const article of articles) {
    if (!article.topicId) continue;
    countByTopic.set(article.topicId, (countByTopic.get(article.topicId) ?? 0) + 1);
  }

  return [...topics].sort((a, b) => (countByTopic.get(a.id) ?? 0) - (countByTopic.get(b.id) ?? 0))[0];
}

/**
 * Drafts one article via Claude for the given topic. No mock fallback --
 * unlike debrief analysis, a "mock article" would just be fabricated
 * content, which this pipeline explicitly must not produce. Callers should
 * surface the error rather than silently degrading.
 */
export interface ArticleDraft {
  title: string;
  dek: string;
  body: string;
  bodyBlocks: ArticleBody;
  slug: string;
  /** What the fact-check, copy-edit, and design passes changed. */
  reviewNotes: EditorialNote[];
  /** Real citations, gathered by the research pass. Empty if it didn't run. */
  sources: Source[];
}

export async function generateArticleDraft(
  topic: ResourceTopic,
  idea?: ArticleIdea | null,
  /** Progress, surfaced in the CMS. See lib/content/draft-jobs.ts. */
  report: (stage: string) => void = () => {},
): Promise<ArticleDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set -- cannot generate an article");

  const repo = getRepository();
  const existing = await repo.listArticles({ topicId: topic.id });

  // Research first. A writer with no source material invents authoritative
  // detail, which is exactly how a fabricated statistic reaches the page; the
  // fact checker downstream can only smell such a claim, not check it.
  // Failure is survivable -- the article is still reviewed by a human -- but
  // it must be visible, so the prompt is told there is no brief rather than
  // silently omitting one.
  let brief: ResearchBrief = { findings: [], gaps: [] };
  report("Researching");
  try {
    brief = await researchArticle({
      topic,
      title: idea?.title ?? topic.name,
      angle: idea?.angle ?? topic.description,
      targetQuery: idea?.targetQuery ?? topic.description,
    });
  } catch (err) {
    console.error("[content-pipeline] research failed:", err);
  }

  report(
    brief.findings.length > 0
      ? `Writing from ${brief.findings.length} sources`
      : "Writing (no sources found)",
  );
  console.log("[content-pipeline] writing");

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    // Structured output across 4-6 sections plus an FAQ needs more room than
    // the flat-prose version did.
    max_tokens: 4000,
    system: ARTICLE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildArticleUserPrompt({
          topicName: topic.name,
          topicDescription: topic.description,
          existingTitles: existing.map((a) => a.title),
          idea: idea ?? null,
          research: formatBrief(brief),
        }),
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude response contained no text content");
  }

  const parsed = generatedArticleSchema.parse(JSON.parse(extractJson(textBlock.text)));

  // The parts that can't be missing. A draft with no answer or no sections
  // isn't a draft a human can finish -- it's a blank page with a headline,
  // and saving it would just put the work back on the reviewer.
  if (!parsed.title.trim()) throw new Error("Claude returned an article with no title");
  if (!parsed.answer.trim()) throw new Error("Claude returned an article with no lead answer");
  const sections = parsed.sections.filter((s) => s.heading.trim() && s.body.trim());
  if (sections.length === 0) throw new Error("Claude returned an article with no sections");

  const bodyBlocks: ArticleBody = {
    answer: parsed.answer.trim(),
    keyFacts: parsed.keyFacts.map((f) => f.trim()).filter(Boolean),
    sections: sections.map((s) => ({
      heading: s.heading.trim(),
      body: s.body.trim(),
      steps: (s.steps ?? []).map((step) => step.trim()).filter(Boolean),
      // A one-item list isn't a procedure. Dropping it keeps a paragraph from
      // being promoted to a numbered step for the look of it.
      tip: s.tip?.trim() || null,
      subsections: (s.subsections ?? [])
        .map((sub) => ({ heading: sub.heading.trim(), body: sub.body.trim() }))
        .filter((sub) => sub.heading && sub.body),
      // Verbatim or nothing. A pull quote that paraphrases is new copy
      // dressed as emphasis: it lengthens the page instead of making it
      // scannable, and a reader who spots the difference stops trusting the
      // device. Compared loosely because the model tends to re-punctuate.
      pullQuote: verbatimQuote(s.pullQuote, s.body),
      comparison:
        s.comparison && s.comparison.left.trim() && s.comparison.right.trim()
          ? {
              leftLabel: s.comparison.leftLabel.trim() || "This",
              left: s.comparison.left.trim(),
              rightLabel: s.comparison.rightLabel.trim() || "Not this",
              right: s.comparison.right.trim(),
            }
          : null,
      checklist: (s.checklist ?? []).map((c) => c.trim()).filter(Boolean),
    })).map((s) => ({
      ...s,
      // A one-item list is not a procedure, and a one-item checklist is a
      // sentence. Both get dropped rather than rendered as a list of one.
      steps: s.steps.length > 1 ? s.steps : [],
      checklist: s.checklist.length > 1 ? s.checklist : [],
    })),
    faq: parsed.faq
      .filter((f) => f.question.trim() && f.answer.trim())
      .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() })),
  };

  // The writer's draft now goes through fact-check, copy-edit, and design.
  // Separate passes because one model writing once has no incentive to catch
  // its own invented statistic -- a fabricated number makes the article more
  // persuasive, which is what the writer is optimising for.
  console.log("[content-pipeline] written; reviewing");
  const reviewed = await reviewArticle(bodyBlocks, formatBrief(brief), report);
  console.log("[content-pipeline] review complete");

  // Applied after every pass, not before: the copy editor rewrites sentences
  // and can reintroduce a British form the writer didn't use. The prompt asks
  // for American spelling; this is what makes it true.
  const american = americanized(reviewed.body);

  return {
    title: toUsSpelling(parsed.title.trim()),
    dek: toUsSpelling(parsed.dek.trim()),
    bodyBlocks: american,
    // Flat copy for articles.body -- excerpts, search, and anything that
    // predates the structure.
    body: toPlainText(american),
    slug: slugify(parsed.title),
    reviewNotes: reviewed.notes,
    // Real URLs the researcher retrieved. sources was hardcoded empty until
    // now precisely because an invented citation is worse than none.
    sources: sourcesFrom(brief),
  };
}


/** Every piece of prose in a body, run through the spelling fix. */
function americanized(body: ArticleBody): ArticleBody {
  return {
    answer: toUsSpelling(body.answer),
    keyFacts: body.keyFacts.map(toUsSpelling),
    sections: body.sections.map((s) => ({
      ...s,
      heading: toUsSpelling(s.heading),
      body: toUsSpelling(s.body),
      steps: s.steps?.map(toUsSpelling),
      tip: s.tip ? toUsSpelling(s.tip) : s.tip,
      checklist: s.checklist?.map(toUsSpelling),
      pullQuote: s.pullQuote ? toUsSpelling(s.pullQuote) : s.pullQuote,
      comparison: s.comparison
        ? {
            leftLabel: toUsSpelling(s.comparison.leftLabel),
            left: toUsSpelling(s.comparison.left),
            rightLabel: toUsSpelling(s.comparison.rightLabel),
            right: toUsSpelling(s.comparison.right),
          }
        : s.comparison,
      subsections: s.subsections?.map((sub) => ({
        heading: toUsSpelling(sub.heading),
        body: toUsSpelling(sub.body),
      })),
    })),
    faq: body.faq.map((f) => ({ question: toUsSpelling(f.question), answer: toUsSpelling(f.answer) })),
  };
}

/**
 * Returns the quote only if it actually appears in the body it claims to come
 * from. Normalized for punctuation and whitespace, because a model will
 * happily return the same sentence with different quote marks or a dash
 * swapped for a comma, and that is still the writer's line.
 */
function verbatimQuote(quote: string | null | undefined, body: string): string | null {
  const trimmed = quote?.trim();
  if (!trimmed) return null;
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[\u2018\u2019\u201c\u201d"']/g, "")
      .replace(/[\u2014\u2013,;:.!?]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  return normalize(body).includes(normalize(trimmed)) ? trimmed : null;
}
