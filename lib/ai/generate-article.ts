import Anthropic from "@anthropic-ai/sdk";
import { ARTICLE_SYSTEM_PROMPT, buildArticleUserPrompt } from "./article-prompt";
import { generatedArticleSchema, type GeneratedArticle } from "./article-schema";
import { getRepository } from "@/lib/data";
import { slugify } from "@/lib/slugify";
import type { ResourceTopic } from "@/lib/types";

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

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return text;
  return text.slice(start, end + 1);
}

/**
 * Drafts one article via Claude for the given topic. No mock fallback --
 * unlike debrief analysis, a "mock article" would just be fabricated
 * content, which this pipeline explicitly must not produce. Callers should
 * surface the error rather than silently degrading.
 */
export async function generateArticleDraft(topic: ResourceTopic): Promise<GeneratedArticle & { slug: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set -- cannot generate an article");

  const repo = getRepository();
  const existing = await repo.listArticles({ topicId: topic.id });

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    system: ARTICLE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildArticleUserPrompt({
          topicName: topic.name,
          topicDescription: topic.description,
          existingTitles: existing.map((a) => a.title),
        }),
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude response contained no text content");
  }

  const parsed = generatedArticleSchema.parse(JSON.parse(extractJson(textBlock.text)));
  if (!parsed.title.trim() || !parsed.body.trim()) {
    throw new Error("Claude returned an incomplete article");
  }

  return { ...parsed, slug: slugify(parsed.title) };
}
