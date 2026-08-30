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
 * Shot types for articles about FLYING an aeroplane -- technique, procedure,
 * weather, the aircraft itself.
 */
const FLYING_SHOTS = [
  "an empty cockpit filled with light -- sun through the windscreen, warm reflections on the glareshield",
  "an object close up and beautifully lit: a headset on a seat, a kneeboard, a fuel tester, keys on a wing",
  "an aircraft on the ramp from outside, clean air, big sky, strong sunlight",
  "the view a pilot has -- out the windscreen, over the cowling, down a runway toward open country",
  "an aircraft airborne, seen against sky and terrain, wing catching the sun",
  "the weather or the ground the article is about: a gust front, a valley in haze, a mountain pass, a runway wet after rain has cleared",
] as const;

/**
 * Shot types for articles about PEOPLE -- instructors, students, schools,
 * money, scheduling, decisions.
 *
 * There is no photograph of an aeroplane that is about a student changing
 * instructors, and asking for one produces a stock aircraft shot with a
 * metaphor attached. These are the rooms and objects where those things
 * actually happen, empty.
 */
const GROUND_SHOTS = [
  "two chairs at a briefing table, one pushed back, morning light across it",
  "an empty briefing room or crew room, the light good, nobody in it yet",
  "a desk after a lesson: headset down, notebook closed, a cold coffee",
  "the walk out to the ramp seen from the doorway, aircraft small in the distance",
  "a hangar office or a schedule wall, worn and specific, no legible writing",
  "a kitchen table the night before a lesson, or a hotel room on a cross-country",
] as const;

/**
 * Which pool an article draws from.
 *
 * The rotation exists so a hundred articles are not the same photograph, but
 * hashing across ONE list ignores what the article is about -- which is how a
 * piece on noticing a student is leaving you drew "an aircraft airborne" and
 * the director, told not to substitute, wrote a poem to justify it.
 *
 * Keyword matching rather than a model call: it runs on the title, it is
 * cheap, and the failure mode is mild. A people-article mistakenly given a
 * flying shot is the status quo; a flying-article given a briefing room is a
 * duller picture, not a wrong one.
 */
const PEOPLE_SUBJECT = /\b(instructor|cfi|student|school|hire|hiring|switch|switching|quit|leave|leaving|cost|costs|price|pricing|money|budget|business|schedule|scheduling|book|booking|retention|churn|customer|client|manage|managing|staff|team|communicat|relationship|expectation|feedback|debrief|syllabus|curriculum|checkride prep|career)\b/i;

export function isPeopleSubject(title: string): boolean {
  return PEOPLE_SUBJECT.test(title);
}

/**
 * Which shot type this article gets.
 *
 * Assigned rather than chosen. Given a list and a free hand, the director
 * converged on the same two or three pictures -- cockpit interiors and
 * headsets -- because those are the most obvious answer to almost any flight
 * training subject. The same collapse as every aircraft being a 172.
 *
 * Hashed off the title so it is stable for a given article (a redraft gets
 * the same treatment) while spreading across the list as articles accumulate.
 */
function shotTypeFor(title: string): string {
  const pool: readonly string[] = isPeopleSubject(title) ? GROUND_SHOTS : FLYING_SHOTS;
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) | 0;
  return pool[Math.abs(hash) % pool.length];
}

const briefSchema = z.object({
  subject: z.string().default("").catch(""),
  light: z.string().default("").catch(""),
  /** Why this picture belongs to this article. Carried through to the editor, which checks it. */
  connection: z.string().default("").catch(""),
});

const SYSTEM = `You art-direct one photograph for a flight-training article. You do not write the article.

Pick a subject that belongs to THIS article specifically. An article about chair-flying is not the same picture as one about crosswind landings, and the difference should be visible.

YOUR SHOT TYPE IS ASSIGNED, NOT CHOSEN

You will be given one shot type. Use it. Do not substitute a different one because it seems to fit the article better -- it is assigned precisely so that a hundred articles do not all end up as the same photograph, and "what fits best" is how they do.

Interpret it specifically for THIS article. The assignment is the kind of picture; the subject within it is yours.

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

NO METAPHOR. THIS IS THE RULE THAT KEEPS GETTING BROKEN.

The connection you give must be LITERAL: the picture shows a thing the article actually talks about. Never symbolic. Never an image chosen first and explained afterwards.

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

YOUR ASSIGNED SHOT TYPE: ${shotTypeFor(input.title)}

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
