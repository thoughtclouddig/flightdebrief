import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { extractJson } from "./extract-json";

/**
 * Writes the image prompt for one article.
 *
 * The old prompt asked for "a general aviation cockpit, ramp, or training
 * environment" for every article, and got the same picture every time: two
 * people mid-conversation in a cockpit. That is the stock-photo default, and
 * it is also where image models are worst -- faces, hands on controls, and
 * avionics that render as gibberish are the three things people notice
 * immediately as machine-made.
 *
 * So this asks for a specific subject drawn from what the article is actually
 * about, and steers away from the failure modes rather than into them.
 *
 * The look is bright and cinematic on purpose. The first version asked for
 * documentary realism -- muted colour, grain, "quiet" -- and combined with a
 * shot list full of rain and overcast it produced a run of images that read
 * as bleak. Flight training is not a bleak subject, and an article about
 * getting better at something should not be illustrated like a story about
 * losing something.
 */

const MODEL = "claude-sonnet-5";
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Shot types that photograph well and don't require a model to draw a
 * convincing human. Named explicitly because "be creative" produces the
 * average of everything, which is the stock photo we're trying to avoid.
 */
/**
 * There is no shot list any more, and that is the point.
 *
 * It started as five airport scenes to stop every image being a cockpit, grew
 * to eight, then split into two pools routed by subject. Every version
 * produced the same complaint: the pictures all look like each other, because
 * a list of subjects IS a list of the same subjects.
 *
 * What replaced it is one instruction -- photograph the physical CONSEQUENCE
 * of what the article describes -- and that generates variety intrinsically.
 * Two articles cannot share an object unless they share an argument.
 */

const briefSchema = z.object({
  subject: z.string().default("").catch(""),
  light: z.string().default("").catch(""),
  /** Why this picture belongs to this article. Carried through to the editor, which checks it. */
  connection: z.string().default("").catch(""),
});

const SYSTEM = `You art-direct one photograph for a flight-training article. You do not write the article.

Pick a subject that belongs to THIS article specifically. An article about chair-flying is not the same picture as one about crosswind landings, and the difference should be visible.

FIND THE PHYSICAL CONSEQUENCE

This is the whole job. Ask: if what this article describes is happening, what OBJECT in the world would exist differently? Photograph that.

An article about noticing a student has quietly switched instructors:
  A wall of headset hooks in a crew room, three headsets hanging, one hook bare.
The hook is empty BECAUSE a student stopped coming. That is a consequence, not a symbol.

An article about chair-flying:
  A kitchen chair pulled out from the table at an angle no one sits at, a checklist face-down beside it.

An article about the cost of repeating a lesson:
  Two identical fuel receipts on a desk, one on top of the other.

Compare the failure this replaced: "a lone aircraft, disconnected from any ground crew, reflecting the quiet distance between instructor and student". The aircraft is not a consequence of anything. It is an arbitrary object with a mood attached, which is what a picture looks like when nobody asked the question above.

THESE OBJECTS ARE USED UP

Headsets, kneeboards, logbooks, aviator sunglasses, a coffee cup beside a checklist. Do not photograph them. Not as the subject, not on the table in the background.

They are the aviation equivalent of the Cessna 172: the most available answer to "an aviation object", so every article converges on them and the page ends up looking like one photograph taken twelve times. Two of the last three came back as headsets on a table.

The only exception is an article literally about the object -- a piece about choosing a headset may photograph a headset.

If the consequence you found is a headset, you have not finished the work. Ask again: what ELSE would be different? A logbook page is not the answer either. Chairs, doors, whiteboards, schedule blocks, car keys, a thermos, a folded chart, an empty parking space, a light left on, a door propped open, the second cup nobody poured.

BE SPECIFIC, AND DO NOT REACH FOR THE AIRPORT BY DEFAULT

A hangar, a ramp, a parked aeroplane, a windsock: these are what this comes out as when the question has not been answered. They are only right when the article is literally about them. Most of these articles happen in crew rooms, at kitchen tables, on desks, in cars, in the ten minutes before a lesson -- photograph there.

If an aircraft genuinely belongs in the frame, do not name a type. Someone downstream chooses it, and naming one too makes the prompt contradict itself.

NO PEOPLE

Not one. No student, no instructor, no pilot, no hands, no silhouettes, no figures in the distance. Every previous attempt at this put a student in an airplane, and it looked like stock photography every time.

An empty cockpit says more about a lesson than a posed one does, and models render objects, aircraft, and weather convincingly while rendering people badly -- faces and hands are the first thing a reader clocks as machine-made.

ALSO NEVER
- Any legible instrument panel, avionics display, or gauge face. These come out as gibberish.
- Anything requiring text: signs, placards, avionics readouts, tail numbers in focus.
- Cliches: sunset silhouette with arms raised, a compass rose, a paper map and coffee.

LIGHT -- this matters as much as the subject

Bright, warm, and open. Golden hour, clear high-desert morning, sun breaking across a ramp, big blue sky with structured cloud. The feeling is early in a good flying day.

Never overcast, grey, rainy, dim, night, or fog. Not because those aren't real, but because this illustrates articles about getting better at flying, and a reader should want to be there. An article about improving should not look like an article about loss.

NEVER NAME AN AIRCRAFT TYPE

Not "a Cessna 172", not "a Skyhawk", not "a Cherokee". Say "a single-engine trainer", "a training aeroplane", "a light twin" -- or better, describe what it is doing rather than what it is.

Someone else picks the type, after you, and their choice is the one the photographer receives. If you name one too, the prompt carries two different aeroplanes and contradicts itself. It is also how every picture ended up a 172: naming the obvious type is exactly the reflex the assignment exists to defeat.

NO METAPHOR

The connection you give must name the consequence: THIS object is like this BECAUSE of what the article describes. Never a mood, never a resemblance, never an image chosen first and explained afterwards.

This was a real answer, for an article about noticing that a student is switching instructors because of you:

  subject:    "A Cessna 172 banked in a turn, alone in the frame with no other traffic nearby"
  connection: "the solitary aircraft, disconnected from any ground crew, reflects the quiet, unspoken distance that grows between an instructor and a student who is drifting away"

That is a generic aeroplane photograph with a poem attached. The aircraft is not lonely. Nothing in that frame is about instructors. If your connection contains "reflects", "represents", "symbolises", "evokes", "speaks to", or "mirrors", you have written an excuse instead of finding a picture. Start again.

Be concrete. "A headset resting on the left seat of a Cessna 172, morning sun pouring through the side window" is a photograph. "Aviation training concept" is not.

Return ONLY this JSON, no fences:

{"subject": "what is in frame, one sentence", "light": "time of day and weather, a few words", "connection": "the specific thing in the article this picture is about, one short sentence"}`;

/**
 * What the picture is about. The photographer decides how it is shot --
 * see lib/ai/photographer.ts. Splitting the two is what stopped every
 * article getting the same competent, interchangeable frame.
 */
export interface ArtBrief {
  subject: string;
  light: string;
  /**
   * What in the article this picture is about.
   *
   * Carried to the photo editor, which is the only step that sees the actual
   * frame. Without it the editor can check for people, text and gloom but not
   * for relevance -- which is how a run of handsome, interchangeable airport
   * photographs got published.
   */
  connection: string;
  /** The article this was directed for, so the editor can judge the fit. */
  title: string;
}

const DEFAULT_BRIEF: Omit<ArtBrief, "title"> = {
  subject: "An empty general aviation cockpit, headset resting on the right seat, sunlight across the seats.",
  light: "Clear golden morning.",
  connection: "",
};

/** Chooses the subject and the light for one article's photograph. */
export async function directArticleImage(input: {
  title: string;
  topicName: string;
  /** The article's lead answer, so the subject can come from the content. */
  answer?: string;
}): Promise<ArtBrief> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ...DEFAULT_BRIEF, title: input.title };

  try {
    const client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Article: "${input.title}"
Topic: ${input.topicName}
${input.answer ? `What it says: ${input.answer}` : ""}


Direct one photograph for it, within that shot type.`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("no text");

    const brief = briefSchema.parse(JSON.parse(extractJson(textBlock.text)));
    if (!brief.subject.trim()) throw new Error("no subject");

    return {
      subject: brief.subject.trim(),
      light: brief.light.trim() || "Clear, bright mid-morning.",
      connection: brief.connection.trim(),
      title: input.title,
    };
  } catch (err) {
    // A generic-but-decent picture beats no picture, and beats blocking the
    // article on the art direction.
    console.error("[art-direction] failed, using the default subject:", err);
    return { ...DEFAULT_BRIEF, title: input.title };
  }
}
