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
const SHOT_TYPES = [
  "an empty cockpit filled with light -- sun through the windscreen, warm reflections on the glareshield",
  "an object close up and beautifully lit: a headset on a seat, a kneeboard, a fuel tester, keys on a wing",
  "an aircraft on the ramp from outside, clean air, big sky, strong sunlight",
  "the view a pilot has -- out the windscreen, over the cowling, down a runway toward open country",
  "the airport as landscape: hangar row, windsock, tiedowns, a taxiway leading somewhere",
  "an aircraft airborne, seen against sky and terrain, wing catching the sun",
] as const;

const briefSchema = z.object({
  subject: z.string().default("").catch(""),
  light: z.string().default("").catch(""),
});

const SYSTEM = `You art-direct one photograph for a flight-training article. You do not write the article.

Pick a subject that belongs to THIS article specifically. An article about chair-flying is not the same picture as one about crosswind landings, and the difference should be visible.

SHOT TYPES -- choose one:
${SHOT_TYPES.map((s) => `- ${s}`).join("\n")}

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

Be concrete. "A headset resting on the left seat of a Cessna 172, morning sun pouring through the side window" is a photograph. "Aviation training concept" is not.

Return ONLY this JSON, no fences:

{"subject": "what is in frame, one sentence", "light": "time of day and weather, a few words"}`;

/**
 * What the picture is about. The photographer decides how it is shot --
 * see lib/ai/photographer.ts. Splitting the two is what stopped every
 * article getting the same competent, interchangeable frame.
 */
export interface ArtBrief {
  subject: string;
  light: string;
}

const DEFAULT_BRIEF: ArtBrief = {
  subject: "An empty general aviation cockpit, headset resting on the right seat, sunlight across the seats.",
  light: "Clear golden morning.",
};

/** Chooses the subject and the light for one article's photograph. */
export async function directArticleImage(input: {
  title: string;
  topicName: string;
  /** The article's lead answer, so the subject can come from the content. */
  answer?: string;
}): Promise<ArtBrief> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return DEFAULT_BRIEF;

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

Direct one photograph for it.`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("no text");

    const brief = briefSchema.parse(JSON.parse(extractJson(textBlock.text)));
    if (!brief.subject.trim()) throw new Error("no subject");

    return { subject: brief.subject.trim(), light: brief.light.trim() || "Clear, bright mid-morning." };
  } catch (err) {
    // A generic-but-decent picture beats no picture, and beats blocking the
    // article on the art direction.
    console.error("[art-direction] failed, using the default subject:", err);
    return DEFAULT_BRIEF;
  }
}
