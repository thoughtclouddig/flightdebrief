import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { authorizeSuperadmin, recordNotFound } from "@/lib/auth/guard";
import { generateArticleDraft } from "@/lib/ai/generate-article";

/**
 * Rewrites an existing article with the current prompt.
 *
 * Articles written before lib/content/article-body.ts existed have only flat
 * prose, so the resource layout -- lead answer, key facts, sections, FAQ --
 * has nothing to render and falls back to paragraphs. They also predate the
 * banned-construction rules in lib/ai/article-voice.ts. Neither is fixable by
 * editing; the article has to be written again.
 *
 * Keeps the slug (URLs that exist stay valid), the topic, and the image, and
 * drops the article back to draft: new text nobody has read should not go
 * straight onto the public site under an old headline's URL.
 */
export async function POST(request: Request, context: RouteContext<"/api/admin/articles/[id]/redraft">) {
  const { id } = await context.params;

  const auth = await authorizeSuperadmin();
  if (auth.response) return auth.response;

  const repo = getRepository();
  const existing = await repo.getArticle(id);
  if (!existing) return recordNotFound();

  const topics = await repo.listResourceTopics();
  const topic = topics.find((t) => t.id === existing.topicId) ?? topics[0];
  if (!topic) return NextResponse.json({ error: "No topics configured." }, { status: 400 });

  // The original idea, when there was one, so the rewrite keeps the angle a
  // human approved rather than inventing a new one under the same title.
  const ideas = await repo.listArticleIdeas({ status: "drafted" });
  const idea = ideas.find((i) => i.articleId === id) ?? null;

  const draft = await generateArticleDraft(topic, idea);

  const article = await repo.updateArticle(id, {
    title: draft.title,
    dek: draft.dek,
    body: draft.body,
    bodyBlocks: draft.bodyBlocks,
    status: "draft",
  });

  return NextResponse.json({ article });
}
