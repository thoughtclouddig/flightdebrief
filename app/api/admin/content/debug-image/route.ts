import { NextResponse } from "next/server";
import { authorizeSuperadmin } from "@/lib/auth/guard";
import { writeImagePrompt } from "@/lib/ai/image-prompt";

/**
 * Shows the prompt an article would get, without generating anything.
 *
 * Reading the prompt is how the image problems actually got diagnosed --
 * every round of guessing from the picture alone produced another prompt
 * tweak aimed at the wrong stage. It costs one cheap model call and no image.
 *
 *   GET /api/admin/content/debug-image?title=...&direction=...
 */
export async function GET(request: Request) {
  const auth = await authorizeSuperadmin();
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const title = url.searchParams.get("title")?.trim();
  if (!title) {
    return NextResponse.json({ error: "Pass ?title=" }, { status: 400 });
  }

  const written = await writeImagePrompt({
    title,
    topicName: url.searchParams.get("topic")?.trim() || "Flight training",
    answer: url.searchParams.get("answer")?.trim() || undefined,
    direction: url.searchParams.get("direction")?.trim() || undefined,
  });

  return NextResponse.json({
    title,
    // "fallback" means the model never ran and this is the canned scene --
    // the thing that made a broken pipeline look like a bad prompt.
    source: written.source,
    error: written.error,
    prompt: written.prompt,
    theTest: "Is this a scene this specific article could be about, or would it fit any article on the site?",
  });
}
