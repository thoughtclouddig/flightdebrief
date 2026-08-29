import OpenAI from "openai";
import { encodeHeroImage } from "@/lib/content/images";
import { directArticleImage } from "./art-direction";

/**
 * Generates a hero image for an article and returns it as an AVIF data: URL,
 * stored directly in articles.image_url (no object storage in this app, same
 * pattern as users.avatar_url). The generator hands back a ~2MB PNG; AVIF at
 * the same dimensions is a small fraction of that, which matters because
 * these are served to every visitor. See lib/content/images.ts. No mock fallback: if
 * OPENAI_API_KEY is unset, callers should treat the article as image-less
 * rather than inventing a placeholder.
 */
export async function generateArticleImage(input: {
  title: string;
  topicName: string;
  /** Free-text steer from a human who didn't like the last one. */
  direction?: string;
  /** The article's lead answer, so the subject can come from the content. */
  answer?: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set -- cannot generate an article image");

  const client = new OpenAI({ apiKey });
  // Art-directed per article rather than one prompt for all of them. See
  // lib/ai/art-direction.ts for why the old one produced the same picture
  // every time.
  const directed = await directArticleImage({
    title: input.title,
    topicName: input.topicName,
    answer: input.answer,
  });
  const prompt = input.direction ? `${directed}\n\nSpecific direction: ${input.direction}` : directed;

  const response = await client.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024",
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI image response contained no image data");

  return encodeHeroImage(Buffer.from(b64, "base64"));
}
