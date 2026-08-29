import OpenAI from "openai";
import { encodeHeroImage } from "@/lib/content/images";
import { directArticleImage } from "./art-direction";
import { adviseAircraft, needsAircraft } from "./aircraft-advisor";
import { composeShot, reviewPhotograph } from "./photographer";

/**
 * Generates a hero image for an article and returns it as an AVIF data: URL,
 * stored directly in articles.image_url (no object storage in this app, same
 * pattern as users.avatar_url). The generator hands back a ~2MB PNG; AVIF at
 * the same dimensions is a small fraction of that, which matters because
 * these are served to every visitor. See lib/content/images.ts. No mock fallback: if
 * OPENAI_API_KEY is unset, callers should treat the article as image-less
 * rather than inventing a placeholder.
 *
 * Three roles, the same way the article itself has a researcher, a writer and
 * a fact-checker:
 *
 *   art director  -- what this specific article's picture is about
 *   photographer  -- how that gets shot: lens, framing, composition, grade
 *   photo editor  -- looks at the frame that came back and can reject it
 *
 * The third one is the one that changes outcomes. Everything before it is
 * text describing an image that does not exist, so "no people in the frame"
 * was only ever a request -- and image models put people in cockpits anyway.
 * The editor sees actual pixels, so it can send the shot back.
 */

/** One reshoot. A second failure usually means the brief is the problem, not the frame. */
const MAX_RESHOOTS = 1;

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
  const brief = await directArticleImage({
    title: input.title,
    topicName: input.topicName,
    answer: input.answer,
  });

  // A named, correctly configured type rather than "an aircraft". Left out
  // entirely when the subject is a headset or a windsock -- naming a type
  // there would invite an aeroplane into a frame that was about something
  // else.
  const aircraft = needsAircraft(brief) ? await adviseAircraft(brief) : null;

  let prompt = await composeShot(brief, aircraft);
  // A human steer outranks everything the pipeline decided: they have seen
  // the picture they didn't like and the agents have not.
  if (input.direction) prompt = `${prompt}\n\nSpecific direction, follow this above all: ${input.direction}`;

  let lastPng: string | null = null;

  for (let attempt = 0; attempt <= MAX_RESHOOTS; attempt++) {
    const response = await client.images.generate({ model: "gpt-image-1", prompt, size: "1024x1024" });
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error("OpenAI image response contained no image data");
    lastPng = b64;

    const verdict = await reviewPhotograph(b64);
    if (verdict.usable) return encodeHeroImage(Buffer.from(b64, "base64"));

    console.warn(
      `[article-image] photo editor rejected attempt ${attempt + 1}: ${verdict.problems.join("; ") || "no reason given"}`,
    );
    if (attempt === MAX_RESHOOTS) break;

    // Reshoot with the rejection folded in, rather than re-rolling the same
    // prompt and hoping. The editor's fix is written to be actionable.
    prompt = [
      prompt,
      `The previous attempt was rejected: ${verdict.problems.join("; ")}.`,
      verdict.fix ? `Shoot it differently: ${verdict.fix}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  // Ship the last frame rather than leaving the article image-less. A picture
  // the editor disliked still beats a blank slot at the top of the page, and
  // the rejection is in the server log for whoever reviews the draft.
  console.warn("[article-image] shipping the last attempt after the reshoot was also rejected.");
  return encodeHeroImage(Buffer.from(lastPng!, "base64"));
}
