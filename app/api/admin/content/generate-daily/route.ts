import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { authorize } from "@/lib/auth/guard";
import { pickNextTopic, generateArticleDraft } from "@/lib/ai/generate-article";
import { generateArticleImage } from "@/lib/ai/generate-article-image";

function hasValidSecret(request: Request): boolean {
  const expected = process.env.CONTENT_PIPELINE_SECRET;
  if (!expected) return false;
  const header = request.headers.get("authorization");
  const provided = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Generates one AI-written article draft for the topic with the fewest
 * existing articles. Always creates a draft, never publishes -- a human
 * reviews and publishes from /admin/articles. Called either by an admin
 * session (the "Generate Draft Now" button) or by a scheduled external
 * caller (Replit Scheduled Deployment) bearing CONTENT_PIPELINE_SECRET.
 */
export async function POST(request: Request) {
  if (!hasValidSecret(request)) {
    const auth = await authorize("admin");
    if (auth.response) return auth.response;
  }

  const topic = await pickNextTopic();
  const draft = await generateArticleDraft(topic);

  let imageUrl: string | null = null;
  try {
    imageUrl = await generateArticleImage({ title: draft.title, topicName: topic.name });
  } catch (err) {
    // The article is still worth keeping without an image -- log and move on.
    console.error("[content-pipeline] image generation failed:", err);
  }

  const repo = getRepository();
  const article = await repo.createArticle({
    slug: draft.slug,
    topicId: topic.id,
    title: draft.title,
    dek: draft.dek,
    body: draft.body,
    authorName: "AfterFlight",
    sources: [],
    imageUrl,
  });

  return NextResponse.json({ article });
}
