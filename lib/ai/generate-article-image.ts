import OpenAI from "openai";

/**
 * Generates a hero image for an article and returns it as a data: URL --
 * stored directly in articles.image_url, same storage-free pattern as
 * users.avatar_url (no object storage in this app). No mock fallback: if
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

  return `data:image/png;base64,${b64}`;
}
