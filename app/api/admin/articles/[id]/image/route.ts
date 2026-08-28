import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { authorizeSuperadmin, recordNotFound } from "@/lib/auth/guard";
import { generateArticleImage } from "@/lib/ai/generate-article-image";

/**
 * Generates a new hero image for an article.
 *
 * A generated image you can't reject is a dead end: the pipeline produced one
 * at draft time and there was no way to ask for another short of pasting a
 * URL over it by hand.
 *
 * An optional `direction` is appended to the prompt, because "generate again"
 * on an unchanged prompt mostly returns the same idea with different pixels.
 * What a person actually wants is "same article, but a cockpit at dusk".
 */
export async function POST(request: Request, context: RouteContext<"/api/admin/articles/[id]/image">) {
  const { id } = await context.params;

  const auth = await authorizeSuperadmin();
  if (auth.response) return auth.response;

  const repo = getRepository();
  const article = await repo.getArticle(id);
  if (!article) return recordNotFound();

  let direction = "";
  try {
    const body = (await request.json()) as { direction?: unknown };
    if (typeof body?.direction === "string") direction = body.direction.trim().slice(0, 300);
  } catch {
    // No body is fine -- that's a plain "try again".
  }

  const topics = await repo.listResourceTopics();
  const topic = topics.find((t) => t.id === article.topicId);

  const imageUrl = await generateArticleImage({
    title: article.title,
    topicName: topic?.name ?? "Flight training",
    direction: direction || undefined,
  });

  // Saved immediately: the editor shows what's stored, and an image sitting
  // in a form that was never saved is the kind of thing you lose by
  // navigating away.
  const updated = await repo.updateArticle(id, { imageUrl });
  return NextResponse.json({ imageUrl: updated.imageUrl });
}
