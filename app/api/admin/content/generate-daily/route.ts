import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { authorizeSuperadmin } from "@/lib/auth/guard";
import { pickNextTopic, generateArticleDraft } from "@/lib/ai/generate-article";
import { generateArticleImage } from "@/lib/ai/generate-article-image";
import { hasContentPipelineSecret } from "@/lib/content/pipeline-auth";
import { startDraftJob } from "@/lib/content/draft-jobs";

/**
 * Drafts the oldest approved article idea. Always creates a draft, never
 * publishes -- a human reviews and publishes from /admin/articles. Called by
 * an admin session (the button) or a scheduled caller bearing
 * CONTENT_PIPELINE_SECRET.
 *
 * Approved ideas drive this, rather than "whichever topic is thinnest". The
 * old behaviour wrote about whatever was least covered, which is a coverage
 * heuristic, not an editorial one -- it had no way to know whether the angle
 * was worth writing. Now the human decision at /admin/ideas is what the
 * pipeline consumes, and the coverage heuristic only survives as the fallback
 * for when the approved queue is empty.
 */
export async function POST(request: Request) {
  if (!hasContentPipelineSecret(request)) {
    const auth = await authorizeSuperadmin();
    if (auth.response) return auth.response;
  }

  const repo = getRepository();

  // An explicit ideaId drafts that one. Without it the pipeline takes the
  // oldest, which is right for a scheduled run and wrong for a person looking
  // at a queue: "draft this one" is the action they mean, and picking
  // something else on their behalf reads as the button doing nothing.
  let requestedIdeaId: string | null = null;
  try {
    const body = (await request.json()) as { ideaId?: unknown };
    if (typeof body?.ideaId === "string") requestedIdeaId = body.ideaId;
  } catch {
    // No body at all is the scheduled case.
  }

  let idea = null;
  if (requestedIdeaId) {
    const requested = await repo.getArticleIdea(requestedIdeaId);
    if (!requested || requested.status !== "approved") {
      return NextResponse.json({ error: "That idea isn't waiting to be drafted." }, { status: 400 });
    }
    idea = requested;
  } else {
    // Oldest first, so an approved idea can't sit behind newer ones forever.
    const approved = (await repo.listArticleIdeas({ status: "approved" })).reverse();
    idea = approved[0] ?? null;
  }

  const topics = await repo.listResourceTopics();
  const topic = idea?.topicId ? topics.find((t) => t.id === idea.topicId) ?? (await pickNextTopic()) : await pickNextTopic();

  // Everything above is fast and can fail usefully in the request. Everything
  // below takes minutes, so it runs as a job: a research pass, four model
  // calls, and an image generation together outlive Replit's proxy timeout,
  // which returned its own 502 while the work carried on and the article
  // landed anyway -- an error reported for something that succeeded.
  const job = startDraftJob(async (report) => {
    const draft = await generateArticleDraft(topic, idea, report);

    report("Generating the image");
    let imageUrl: string | null = null;
    try {
      imageUrl = await generateArticleImage({
        title: draft.title,
        topicName: topic.name,
        answer: draft.bodyBlocks.answer,
      });
    } catch (err) {
      // The article is still worth keeping without an image -- log and move on.
      console.error("[content-pipeline] image generation failed:", err);
    }

    report("Saving");
    const article = await repo.createArticle({
      slug: draft.slug,
      topicId: topic.id,
      title: draft.title,
      dek: draft.dek,
      body: draft.body,
      authorName: "AfterFlight",
      // Real URLs from the research pass. This was hardcoded empty while the
      // pipeline had no researcher, because a model-invented citation is
      // worse than no citation at all.
      sources: draft.sources,
      imageUrl,
      bodyBlocks: draft.bodyBlocks,
    });

    // Link the idea to what it became, so the queue reflects reality and the
    // same idea can't be drafted twice.
    if (idea) await repo.setArticleIdeaStatus(idea.id, "drafted", article.id);

    return { articleId: article.id };
  });

  return NextResponse.json({ jobId: job.id }, { status: 202 });
}
