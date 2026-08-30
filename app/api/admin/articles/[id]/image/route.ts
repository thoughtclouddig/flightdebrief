import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { authorizeSuperadmin, recordNotFound } from "@/lib/auth/guard";
import { generateArticleImage } from "@/lib/ai/generate-article-image";
import type { ImagePromptParts } from "@/lib/ai/image-prompt";

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
  let editedParts: ImagePromptParts | undefined;
  try {
    const body = (await request.json()) as { direction?: unknown; parts?: unknown };
    if (typeof body?.direction === "string") direction = body.direction.trim().slice(0, 300);
    // A brief edited in the form. Sent whole so the writer is skipped
    // entirely -- an editor who changed the light should get exactly that,
    // not a fresh scene that happens to be lit differently.
    if (body?.parts && typeof body.parts === "object") {
      const p = body.parts as Record<string, unknown>;
      const str = (k: string) => (typeof p[k] === "string" ? (p[k] as string) : "");
      const parts: ImagePromptParts = {
        scene: str("scene"),
        subjects: str("subjects"),
        aircraft: str("aircraft"),
        light: str("light"),
        camera: str("camera"),
        rationale: str("rationale"),
      };
      if (parts.scene.trim()) editedParts = parts;
    }
  } catch {
    // No body is fine -- that's a plain "try again".
  }

  const topics = await repo.listResourceTopics();
  const topic = topics.find((t) => t.id === article.topicId);

  let generated: { imageUrl: string; parts: ImagePromptParts };
  try {
    generated = await generateArticleImage({
      title: article.title,
      topicName: topic?.name ?? "Flight training",
      // The lead answer is the most concrete sentence in the article, so the
      // scene can come from what the piece actually says.
      answer: article.bodyBlocks?.answer,
      direction: direction || undefined,
      // An edited brief posted from the form skips the writer entirely.
      parts: editedParts,
    });
  } catch (err) {
    // The generation chain has several stages that can fail for reasons worth
    // reading -- a content-policy rejection names what it objected to, a rate
    // limit says to wait. Returning the detail beats a bare 500.
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[article-image] generation failed:", detail);
    return NextResponse.json({ error: "Failed to generate an image.", detail }, { status: 502 });
  }

  // Saved immediately: the editor shows what's stored, and an image sitting
  // in a form that was never saved is the kind of thing you lose by
  // navigating away.
  // The brief is stored with the image so the form can show what produced
  // it, and so the next edit starts from this rather than from nothing.
  const updated = await repo.updateArticle(id, {
    imageUrl: generated.imageUrl,
    imagePrompt: generated.parts,
  });
  return NextResponse.json({ imageUrl: updated.imageUrl, parts: updated.imagePrompt });
}
