import { NextResponse } from "next/server";
import { authorizeSuperadmin } from "@/lib/auth/guard";
import { composeImagePrompt, writeImagePrompt } from "@/lib/ai/image-prompt";

/**
 * Shows the shot brief an article would get, without generating an image.
 *
 * Reading the brief is how these problems actually get diagnosed -- guessing
 * from the picture produced four prompt rewrites aimed at the wrong stage,
 * one of them at a prompt that was never running.
 */
export async function GET(request: Request) {
  const auth = await authorizeSuperadmin();
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const title = url.searchParams.get("title")?.trim();
  if (!title) return NextResponse.json({ error: "Pass ?title=" }, { status: 400 });

  const direction = url.searchParams.get("direction")?.trim() || undefined;
  try {
    const parts = await writeImagePrompt({
      title,
      topicName: url.searchParams.get("topic")?.trim() || "Flight training",
      answer: url.searchParams.get("answer")?.trim() || undefined,
      direction,
    });
    return NextResponse.json({ title, parts, composed: composeImagePrompt(parts, direction) });
  } catch (err) {
    // Reported, not papered over. A failure here used to return a canned
    // scene that looked like a real answer.
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "The prompt writer failed.", detail }, { status: 502 });
  }
}
