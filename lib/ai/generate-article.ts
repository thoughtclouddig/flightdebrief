import Anthropic from "@anthropic-ai/sdk";
import { ARTICLE_SYSTEM_PROMPT, buildArticleUserPrompt } from "./article-prompt";
import { generatedArticleSchema } from "./article-schema";
import { toPlainText, type ArticleBody } from "@/lib/content/article-body";
import { extractJson } from "./extract-json";
import { getRepository } from "@/lib/data";
import { slugify } from "@/lib/slugify";
import type { ArticleIdea, ResourceTopic } from "@/lib/types";

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
}

export async function generateArticleDraft(
  topic: ResourceTopic,
  idea?: ArticleIdea | null,
): Promise<ArticleDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set -- cannot generate an article");

  const repo = getRepository();
  const existing = await repo.listArticles({ topicId: topic.id });

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
    })).map((s) => ({ ...s, steps: s.steps.length > 1 ? s.steps : [] })),
    faq: parsed.faq
      .filter((f) => f.question.trim() && f.answer.trim())
      .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() })),
  };

  return {
    title: parsed.title.trim(),
    dek: parsed.dek.trim(),
    bodyBlocks,
    // Flat copy for articles.body -- excerpts, search, and anything that
    // predates the structure.
    body: toPlainText(bodyBlocks),
    slug: slugify(parsed.title),
  };
}
