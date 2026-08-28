import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { ARTICLE_IDEAS_SYSTEM_PROMPT, buildArticleIdeasUserPrompt } from "./article-ideas-prompt";
import { extractJson } from "./extract-json";
import { getRepository } from "@/lib/data";
import type { CreateArticleIdeaInput } from "@/lib/data/types";
import type { ResourceTopic } from "@/lib/types";

const ideasSchema = z.object({
  ideas: z
    .array(
      z.object({
        title: z.string().default(""),
        angle: z.string().default(""),
        targetQuery: z.string().default(""),
        rationale: z.string().default(""),
      }),
    )
    .default([]),
});

/**
 * Proposes article ideas for one topic. No mock fallback, for the same reason
 * generateArticleDraft has none: a fabricated idea is worse than no idea, and
 * silently degrading would fill the review queue with filler that looks like
 * real suggestions.
 *
 * Existing published titles AND ideas already awaiting review are both passed
 * in -- without the second, every run re-proposes the same angles and the
 * queue fills with duplicates a human then has to reject one by one.
 */
export async function generateArticleIdeas(topic: ResourceTopic, count = 5): Promise<CreateArticleIdeaInput[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set -- cannot generate article ideas");

  const repo = getRepository();
  const [existing, pending] = await Promise.all([
    repo.listArticles({ topicId: topic.id }),
    repo.listArticleIdeas({ status: "proposed" }),
  ]);

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1500,
    system: ARTICLE_IDEAS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildArticleIdeasUserPrompt({
          topicName: topic.name,
          topicDescription: topic.description,
          count,
          existingTitles: existing.map((a) => a.title),
          pendingTitles: pending.filter((i) => i.topicId === topic.id).map((i) => i.title),
        }),
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude response contained no text content");
  }

  const parsed = ideasSchema.parse(JSON.parse(extractJson(textBlock.text)));

  // Drop anything without a title -- a blank row in a review queue is noise
  // the human has to clear, and .default("") above means it can happen.
  return parsed.ideas
    .filter((idea) => idea.title.trim().length > 0)
    .map((idea) => ({
      topicId: topic.id,
      title: idea.title.trim(),
      angle: idea.angle.trim(),
      targetQuery: idea.targetQuery.trim(),
      rationale: idea.rationale.trim(),
    }));
}
