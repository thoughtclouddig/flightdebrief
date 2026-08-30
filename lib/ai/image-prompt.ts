import Anthropic from "@anthropic-ai/sdk";

/**
 * Writes the image prompt for an article. One call, one complete scene.
 *
 * This replaces a four-stage chain -- art director, aircraft adviser,
 * photographer, then a reviewer -- that I built up one constraint at a time as
 * each run of images disappointed. No people, no legible text, no naming an
 * aircraft type, an assigned shot type from a fixed list, an assigned airframe,
 * banned props. Every layer was a reasonable response to a real failure, and
 * together they made the output narrower and more uniform: the pictures all
 * looked like each other because there was almost nothing left to choose.
 *
 * A person writing a prompt for a specific headline does not work that way.
 * They picture the scene -- who is in it, what the light is doing, what
 * aeroplane, what time of day -- and describe it. So that is what this asks
 * for, in one pass, with the article's own subject as the only real input.
 *
 * People are allowed. Aircraft can be named. The remaining rules are the two
 * things image models genuinely cannot do rather than matters of taste.
 */

const MODEL = "claude-sonnet-5";
const REQUEST_TIMEOUT_MS = 30_000;

const SYSTEM = `You write the prompt for one photograph illustrating a flight-training article. You write the prompt only -- someone else generates the image.

Write a single paragraph that describes a complete scene, the way a photographer would brief it. Cover:

WHO IS IN IT and what they are doing. A student and instructor at a briefing table. A pilot alone doing a walkaround. Nobody at all, if the scene is better empty. Say their posture and where they are looking -- "leaning over the table, both looking at the same page" is a photograph; "two people talking" is not.

WHERE, precisely. A flight school briefing room, a hangar, the left seat, a ramp at a small field, a kitchen table at home. Name the surfaces and what is on them.

THE AIRCRAFT, if one is in frame. Name a type and describe it correctly: a Cessna 172 is a high-wing single with wing struts, a fixed nosewheel, and one propeller on the nose; a Cherokee is a low-wing single; a Seminole is a twin with one engine on each wing. Vary the type across articles -- not everything is a 172. If no aeroplane belongs in the picture, leave it out.

THE LIGHT. Time of day, direction, quality. Low sun through a west-facing window. Overcast noon on a ramp. Warm lamplight in a briefing room after dark.

THE CAMERA. Focal length, distance, angle, depth of field. 35mm from across the table, shallow enough that the far wall goes soft.

MAKE IT BELONG TO THIS ARTICLE

The scene should be one this specific article could be about, not a generic aviation picture. An article about a student switching instructors is a scene about two people, or about a room where a conversation is happening or failing to. An article about crosswind technique is a scene about wind and an aeroplane. If the scene would fit equally on any other article on the site, write a different one.

TWO HARD LIMITS -- these are what image models actually get wrong

No legible text anywhere: no signage, no writing on a whiteboard, no instrument markings, no tail numbers in focus. Models render text as convincing gibberish and it is the first thing a reader spots. Paper and screens can be in frame, just turned away, blurred, or out of focus.

No readable instrument panels or avionics displays, for the same reason.

Return the prompt itself as plain prose. No preamble, no JSON, no quotation marks around it.`;

/** A decent, specific scene for when the model is unavailable. */
const FALLBACK =
  "A flight school briefing room in late afternoon, low sun through a west-facing window laying a bright band across a wooden table. Two chairs pulled up at an angle to each other, one slightly pushed back. A Cessna 172 -- high wing, wing struts, fixed nosewheel, single propeller on the nose -- visible through the window on the ramp beyond, softly out of focus. Shot at 35mm from across the table, shallow depth of field so the far wall falls away. Warm, natural, unposed. No legible text or readable instruments anywhere in frame.";

export interface ImagePrompt {
  prompt: string;
  /**
   * Whether a model actually wrote this, or it is the canned scene.
   *
   * Surfaced rather than swallowed. The chain this replaced fell back to a
   * hardcoded cockpit on failure and only logged it, so a run of identical
   * generic images looked like a prompt that needed rewriting -- and four
   * rounds of rewriting a prompt that had not run followed. A fallback that
   * cannot be told apart from a result is worse than an error.
   */
  source: "model" | "fallback";
  /** Why the model call failed, when it did. */
  error?: string;
}

export async function writeImagePrompt(input: {
  title: string;
  topicName: string;
  /** The article's lead answer -- the most concrete sentence in the piece. */
  answer?: string;
  /** A human's steer, which outranks everything the model would have chosen. */
  direction?: string;
}): Promise<ImagePrompt> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      prompt: withDirection(FALLBACK, input.direction),
      source: "fallback",
      error: "ANTHROPIC_API_KEY is not set",
    };
  }

  try {
    const client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Article title: "${input.title}"
Topic: ${input.topicName}
${input.answer ? `What the article says: ${input.answer}` : ""}
${input.direction ? `\nThe editor asked for this specifically, and it overrides your own judgement: ${input.direction}` : ""}

Write the photograph.`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("no text");
    const prompt = textBlock.text.trim();
    if (prompt.length < 80) throw new Error("prompt too short to be a scene");
    return { prompt: withDirection(prompt, input.direction), source: "model" };
  } catch (err) {
    // A decent generic scene beats blocking the article on the prompt writer,
    // but the caller is told, and the debug route prints it.
    const error = err instanceof Error ? err.message : String(err);
    console.error("[image-prompt] MODEL CALL FAILED, using the canned scene:", error);
    return { prompt: withDirection(FALLBACK, input.direction), source: "fallback", error };
  }
}

/** The human steer still applies when the model didn't run. */
function withDirection(prompt: string, direction?: string): string {
  return direction ? `${prompt}\n\nSpecific direction, follow this above all: ${direction}` : prompt;
}
