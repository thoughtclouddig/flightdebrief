import OpenAI from "openai";
import { encodeHeroImage } from "@/lib/content/images";
import { composeImagePrompt, writeImagePrompt, type ImagePromptParts } from "./image-prompt";

/**
 * Generates a hero image and returns it with the shot brief it came from.
 *
 * The brief is returned rather than discarded so the caller can store it on
 * the article: an editor who dislikes the picture can change the light or the
 * aircraft and regenerate, instead of re-rolling a prompt they never see.
 *
 * Stored as an AVIF data: URL in articles.image_url -- no object storage in
 * this app, same pattern as users.avatar_url. The generator hands back a ~2MB
 * PNG; AVIF at the same dimensions is a fraction of that, which matters
 * because these are served to every visitor.
 *
 * There is no fallback prompt. A canned scene substituted on failure looks
 * exactly like a working pipeline producing dull images, which is what made
 * this take four rounds to diagnose.
 */
export async function generateArticleImage(input: {
  title: string;
  topicName: string;
  /** Free-text steer from a human who didn't like the last one. */
  direction?: string;
  /** The article's lead answer, so the scene can come from the content. */
  answer?: string;
  /** An edited brief. When given, the prompt writer is skipped entirely. */
  parts?: ImagePromptParts;
}): Promise<{ imageUrl: string; parts: ImagePromptParts }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set -- cannot generate an article image");

  // An edited brief wins outright: the editor has seen the picture they
  // didn't like and the writer has not.
  const parts = input.parts ?? (await writeImagePrompt(input));
  const prompt = composeImagePrompt(parts, input.direction);

  const client = new OpenAI({ apiKey });
  const response = await client.images.generate({ model: "gpt-image-1", prompt, size: "1024x1024" });
  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI image response contained no image data");

  return { imageUrl: await encodeHeroImage(Buffer.from(b64, "base64")), parts };
}
