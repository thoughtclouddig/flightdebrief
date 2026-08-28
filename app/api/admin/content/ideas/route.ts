import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { generateArticleIdeas } from "@/lib/ai/generate-article-ideas";
import { hasContentPipelineSecret } from "@/lib/content/pipeline-auth";
import { pickNextTopic } from "@/lib/ai/generate-article";

/**
 * Proposes a batch of article ideas for review. Cheap by design -- ideas cost
 * a fraction of a draft, which is what lets the human gate sit here instead of
 * on finished articles.
 *
 * Same dual auth as the daily draft route: an admin session for the button, or
 * CONTENT_PIPELINE_SECRET for a scheduled caller.
 */
export async function POST(request: Request) {
  if (!hasContentPipelineSecret(request)) {
    const auth = await authorize("admin");
    if (auth.response) return auth.response;
  }

  const body = (await request.json().catch(() => ({}))) as { count?: number; topicId?: string };
  // Capped: a runaway count would spend real tokens and bury the queue.
  const count = Math.min(Math.max(body.count ?? 5, 1), 10);

  const repo = getRepository();
  const topic = body.topicId
    ? (await repo.listResourceTopics()).find((t) => t.id === body.topicId)
    : await pickNextTopic();
  if (!topic) return NextResponse.json({ error: "Unknown topic" }, { status: 400 });

  const proposed = await generateArticleIdeas(topic, count);
  const ideas = await repo.createArticleIdeas(proposed);
  return NextResponse.json({ topic: topic.name, ideas });
}
