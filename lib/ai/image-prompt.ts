import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { extractJson } from "./extract-json";

/**
 * Writes the image prompt for an article, as separate parts of a shot.
 *
 * Structured rather than one paragraph so a person can change one element
 * without rewriting the whole thing -- swap the aircraft, move it to dusk,
 * pull the camera back -- and so the edit form has something to put in
 * labeled fields. The parts are composed into the final prompt at generation
 * time by composeImagePrompt().
 *
 * NO FALLBACK. This used to substitute a hardcoded scene when the model call
 * failed, log it, and return it as though it had worked -- so an unknown
 * number of "all the images look the same" complaints were the same canned
 * string, and four rounds of prompt rewriting chased a prompt that had never
 * run. A failure that looks like a result is worse than an error, so this
 * throws and the caller reports it.
 */

const MODEL = "claude-sonnet-5";
const REQUEST_TIMEOUT_MS = 30_000;

export interface ImagePromptParts {
  /** Where it happens, and what is in the room. */
  scene: string;
  /** Who is in frame and what they are doing. Empty when the shot has nobody in it. */
  subjects: string;
  /** The aircraft and its correct configuration. Empty when no airplane belongs. */
  aircraft: string;
  /** Time of day, direction, quality. */
  light: string;
  /** Focal length, distance, angle, depth of field. */
  camera: string;
  /** Why this scene belongs to this article, in one line. Not part of the image. */
  rationale: string;
}

const partsSchema = z.object({
  scene: z.string().default("").catch(""),
  subjects: z.string().default("").catch(""),
  aircraft: z.string().default("").catch(""),
  light: z.string().default("").catch(""),
  camera: z.string().default("").catch(""),
  rationale: z.string().default("").catch(""),
});

const SYSTEM = `You brief one photograph for a flight-training article. You do not generate the image and you do not write the article.

Break the shot into its parts. Each is a separate field so an editor can change one without rewriting the rest.

SCENE -- where it happens and what is in it. A flight school briefing room with a scarred wooden table and mismatched chairs. A hangar floor. The left seat. A kitchen table at home. Name the surfaces and the objects on them.

SUBJECTS -- who is in frame and what they are doing. A student and instructor leaning over the same page. A pilot alone walking the wing. Give posture and where they are looking; "two people talking" is not a photograph. Leave this EMPTY if the picture is better with nobody in it -- an empty room can be the point.

AIRCRAFT -- the type and its correct configuration, when one is in frame. A Cessna 172 is a high-wing single with wing struts, fixed nosewheel, one propeller on the nose. A Cherokee is a low-wing single. A Seminole is a twin with one engine on each wing. Vary the type across articles -- not everything is a 172. Leave EMPTY if no airplane belongs in the picture.

LIGHT -- time of day, direction, quality. Low sun through a west-facing window. Overcast noon. Warm lamplight after dark.

CAMERA -- focal length, distance, angle, depth of field. "35mm from across the table, shallow enough that the far wall goes soft."

RATIONALE -- one line on why this scene belongs to THIS article specifically. This is for the editor, not the image.

MAKE IT BELONG TO THIS ARTICLE

An article about a student switching instructors is a scene about two people, or a room where a conversation is or is not happening. An article about crosswind technique is a scene about wind and an airplane. If the scene would sit equally well on any other article on the site, write a different one.

TWO HARD LIMITS -- what image models actually get wrong

No legible text anywhere: signage, whiteboards, instrument markings, tail numbers in focus. Models render text as convincing gibberish and it is the first thing a reader spots. Paper and screens may be in frame, turned away or out of focus.

No readable instrument panels or avionics displays, for the same reason.

Return ONLY this JSON, no fences:

{"scene": "...", "subjects": "...", "aircraft": "...", "light": "...", "camera": "...", "rationale": "..."}`;

export async function writeImagePrompt(input: {
  title: string;
  topicName: string;
  /** The article's lead answer -- the most concrete sentence in the piece. */
  answer?: string;
  /** A human's steer, which outranks anything the model would choose. */
  direction?: string;
}): Promise<ImagePromptParts> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set -- cannot write an image prompt");

  const client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 });
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Article title: "${input.title}"
Topic: ${input.topicName}
${input.answer ? `What the article says: ${input.answer}` : ""}
${input.direction ? `\nThe editor asked for this specifically, and it overrides your own judgment: ${input.direction}` : ""}

Brief the photograph.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("The prompt writer returned no text");

  const parts = partsSchema.parse(JSON.parse(extractJson(textBlock.text)));
  // Scene and light are the two that every photograph needs. Subjects and
  // aircraft are legitimately empty sometimes; camera without them is a
  // lens with nothing to point at.
  if (!parts.scene.trim() || !parts.light.trim()) {
    throw new Error("The prompt writer returned no scene or no light");
  }
  return parts;
}

/**
 * Assembles the parts into the string the image model receives.
 *
 * Kept separate so an edited set of parts composes exactly the same way a
 * generated one does -- there is no second path where a hand-edited prompt
 * behaves differently from a written one.
 */
export function composeImagePrompt(parts: ImagePromptParts, direction?: string): string {
  return [
    "Photograph, natural light, shot on film.",
    parts.scene,
    parts.subjects,
    parts.aircraft,
    parts.light,
    parts.camera,
    "No legible text anywhere in frame. No readable instrument panels or avionics displays.",
    direction ? `Specific direction, follow this above all: ${direction}` : "",
  ]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
}

/** An empty set, for a form that has nothing stored yet. */
export const EMPTY_IMAGE_PROMPT: ImagePromptParts = {
  scene: "",
  subjects: "",
  aircraft: "",
  light: "",
  camera: "",
  rationale: "",
};
