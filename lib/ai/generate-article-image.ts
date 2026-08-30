import OpenAI from "openai";
import { encodeHeroImage } from "@/lib/content/images";
import { writeImagePrompt } from "./image-prompt";

/**
 * Generates a hero image for an article and returns it as an AVIF data: URL,
 * stored directly in articles.image_url (no object storage in this app, same
 * pattern as users.avatar_url). The generator hands back a ~2MB PNG; AVIF at
 * the same dimensions is a small fraction of that, which matters because
 * these are served to every visitor. See lib/content/images.ts. No mock
 * fallback: if OPENAI_API_KEY is unset, callers should treat the article as
 * image-less rather than inventing a placeholder.
 *
 * The prompt comes from one call now, not four. There used to be an art
 * director, an aircraft adviser, a photographer and a photo editor here,
 * added one at a time as each batch of images disappointed -- and the result
 * was a pipeline that constrained itself into producing the same picture
 * repeatedly. lib/ai/image-prompt.ts has the reasoning.
 */
export async function generateArticleImage(input: {
  title: string;
  topicName: string;
  /** Free-text steer from a human who didn't like the last one. */
  direction?: string;
  /** The article's lead answer, so the scene can come from the content. */
  answer?: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set -- cannot generate an article image");

  const client = new OpenAI({ apiKey });

  // One call writes the whole scene. See lib/ai/image-prompt.ts for why the
  // four-stage chain that used to live here is gone.
  const written = await writeImagePrompt(input);
  if (written.source === "fallback") {
    // Loud, because generating from the canned scene produces exactly the
    // "all the images look the same" symptom while looking like a working
    // pipeline.
    console.warn(`[article-image] prompt writer fell back: ${written.error ?? "unknown"}`);
  }

  const response = await client.images.generate({
    model: "gpt-image-1",
    prompt: written.prompt,
    size: "1024x1024",
  });
  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI image response contained no image data");

  return encodeHeroImage(Buffer.from(b64, "base64"));
}
