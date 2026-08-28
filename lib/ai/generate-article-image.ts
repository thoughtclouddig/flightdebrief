import OpenAI from "openai";
import { encodeHeroImage } from "@/lib/content/images";

/**
 * Generates a hero image for an article and returns it as an AVIF data: URL,
 * stored directly in articles.image_url (no object storage in this app, same
 * pattern as users.avatar_url). The generator hands back a ~2MB PNG; AVIF at
 * the same dimensions is a small fraction of that, which matters because
 * these are served to every visitor. See lib/content/images.ts. No mock fallback: if
 * OPENAI_API_KEY is unset, callers should treat the article as image-less
 * rather than inventing a placeholder.
 */
export async function generateArticleImage(input: { title: string; topicName: string }): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set -- cannot generate an article image");

  const client = new OpenAI({ apiKey });
  const prompt = `Editorial hero photo for a flight-training article titled "${input.title}" (topic: ${input.topicName}). Realistic, high-end aviation photography -- a general aviation cockpit, ramp, or training environment. No text, no logos, no people's faces in close-up.`;

  const response = await client.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024",
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI image response contained no image data");

  return encodeHeroImage(Buffer.from(b64, "base64"));
}
