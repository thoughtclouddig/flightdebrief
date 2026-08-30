import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { extractJson } from "./extract-json";
import type { ArtBrief } from "./art-direction";

/**
 * The general-aviation expert on the image team.
 *
 * Two problems it exists to fix, both visible in the first run of images.
 *
 * One: every aircraft was a Cessna. Nothing in the pipeline named a type, so
 * the model reached for the average trainer, and the average trainer in an
 * image model's head is a high-wing single with a strut. Real training
 * happens in Cherokees, Diamonds, Cirruses, 152s, tailwheels and twins, and a
 * page of nothing but 172s tells a reader we have never been to an airport.
 *
 * Two: the airframes were wrong in ways a pilot spots instantly -- propellers
 * in impossible places most of all. A prompt that says "an aircraft" invites
 * the model to invent one, and invented aircraft have props on wings, two
 * spinners on a single, and gear that does not attach to anything. Naming a
 * real type and describing its actual configuration gives the model something
 * to reproduce instead of something to imagine.
 *
 * This runs between the art director and the photographer: the director has
 * decided what the picture is about, and the photographer needs to know what
 * they are pointing the camera at before choosing a lens.
 */

const MODEL = "claude-sonnet-5";
const REQUEST_TIMEOUT_MS = 30_000;

const specSchema = z.object({
  aircraft: z.string().default("").catch(""),
  configuration: z.string().default("").catch(""),
  avoid: z.string().default("").catch(""),
});

export interface AircraftSpec {
  /** A named type, e.g. "Piper PA-28-181 Archer". */
  aircraft: string;
  /** Its physically correct, visually checkable configuration. */
  configuration: string;
  /** The specific way models get this airframe wrong. */
  avoid: string;
}

/**
 * The fleet a reader would actually see at a training field, and roughly in
 * proportion. Passed to the advisor as the pool to choose from, because "pick
 * a training aircraft" and "pick from this list" produce very different
 * amounts of variety -- the first collapses to the most common answer every
 * time, which is how we ended up with only Cessnas.
 */
const TRAINING_FLEET = [
  "Cessna 172 Skyhawk",
  "Cessna 152",
  "Piper PA-28 Cherokee / Warrior / Archer",
  "Diamond DA40",
  "Diamond DA20",
  "Cirrus SR20",
  "American Champion Citabria",
  "Piper J-3 Cub",
  "Grumman AA-5 Tiger",
  "Beechcraft Musketeer / Sundowner",
  "Piper PA-44 Seminole (twin)",
  "Diamond DA42 Twin Star (twin)",
  "Van's RV-12",
  "Cessna 182 Skylane",
] as const;

/**
 * Which type this article gets.
 *
 * Assigned, not chosen -- the same lesson as the shot types. Told to "vary
 * it", the adviser returned a Cessna 172 three times out of three, because a
 * 172 is the most defensible answer to almost any training subject and a
 * model asked to be varied still optimises for defensible.
 *
 * Hashed off the title so a given article always gets the same aeroplane
 * (a redraft does not silently change it) while the fleet spreads out across
 * articles.
 */
function assignedAircraft(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) | 0;
  return TRAINING_FLEET[Math.abs(hash) % TRAINING_FLEET.length];
}

const SYSTEM = `You are a general aviation expert advising an image team. They are photographing one frame for a flight-training article. Your job is to make sure the aircraft in it is a real aircraft, correctly configured, and not the same one they used last time.

YOUR TYPE IS ASSIGNED, NOT CHOSEN

You will be given one aircraft type. Use it, and name it exactly as given. Do not substitute a different one because it seems to suit the article better.

It is assigned because asking for variety does not produce variety: told to vary the type, the answer came back "Cessna 172" three times running. The 172 is the most defensible answer to almost any training subject, and a publication where every aeroplane is a 172 reads as though nobody involved has been to an airport.

The one exception is a hard requirement in the subject. If the article is explicitly about multi-engine work and you are handed a single, say so in the avoid field -- but do not silently swap the type.

DESCRIBE THE CONFIGURATION

State the features that are visually checkable and physically fixed, in plain words the image model can follow:
- Wing position and support: high wing with lift struts, high wing cantilever, low wing.
- Landing gear: fixed tricycle with a nosewheel, fixed tailwheel with a tailskid, retractable.
- Engine and propeller: for a single, ONE engine in the NOSE with ONE propeller in front of it. For a twin, one engine on each WING, each with its own propeller facing forward.
- Cabin: doors and windows, or a sliding bubble canopy.
- Tail: conventional, T-tail, or V-tail.

NAME THE FAILURE MODE

Say specifically how image models get this airframe wrong, so it can be forbidden. Propellers are the usual one: a propeller anywhere but the nose of a single-engine aeroplane, a spinner on each wing of a Cherokee, a rear-facing pusher prop on a type that has a tractor engine. Also common: struts on a cantilever wing, three main wheels plus a tailwheel, a T-tail grafted onto a type that does not have one, wings attached at the wrong height.

Be concrete. "Wrong propeller placement" helps nobody; "no propellers on the wings -- this type has exactly one, on the nose" does.

Return ONLY this JSON, no fences:

{"aircraft": "the exact type", "configuration": "its physically correct configuration, one or two sentences", "avoid": "the specific errors to forbid"}`;

/**
 * A safe default. The 172 is the one type an image model renders reliably, so
 * it is the right fallback even though the whole point of this agent is not
 * to use it every time.
 */
const FALLBACK: AircraftSpec = {
  aircraft: "Cessna 172 Skyhawk",
  configuration:
    "High wing braced by a single lift strut on each side, fixed tricycle landing gear with a nosewheel, one piston engine in the nose driving one two-blade propeller, conventional tail.",
  avoid:
    "No propellers on the wings and no second engine -- this type has exactly one engine, in the nose. No tailwheel. No T-tail.",
};

export async function adviseAircraft(brief: ArtBrief): Promise<AircraftSpec> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  // Even without a model the assigned type applies, so the fallback is not
  // another 172 by default.
  if (!apiKey) return { ...FALLBACK, aircraft: assignedAircraft(brief.title) };

  try {
    const client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Article: "${brief.title}"
Subject: ${brief.subject}
Light: ${brief.light}

YOUR ASSIGNED AIRCRAFT: ${assignedAircraft(brief.title)}

How must it be built, and how do image models get this airframe wrong?`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("no text");
    const spec = specSchema.parse(JSON.parse(extractJson(textBlock.text)));
    if (!spec.aircraft.trim()) throw new Error("no aircraft named");
    return {
      // The assignment wins. Asking for a type and accepting whatever comes
      // back is how "vary it" produced three 172s -- the configuration and
      // the warnings are the adviser's job, the choice is not.
      aircraft: assignedAircraft(brief.title),
      configuration: spec.configuration.trim() || FALLBACK.configuration,
      avoid: spec.avoid.trim() || FALLBACK.avoid,
    };
  } catch (err) {
    // A correct 172 beats an invented aeroplane, and beats blocking the
    // article on the technical adviser.
    console.error("[aircraft-advisor] failed, using the default type:", err);
    return { ...FALLBACK, aircraft: assignedAircraft(brief.title) };
  }
}

/**
 * Whether this brief involves an aircraft at all.
 *
 * A headset on a seat or a windsock does not need a type specified, and
 * naming one would invite the model to put an aeroplane in a frame that was
 * deliberately about something else.
 */
export function needsAircraft(brief: ArtBrief): boolean {
  // Only when an aeroplane is actually the thing being photographed. The
  // earlier version matched "ramp", "hangar" and "runway" too, so a crew room
  // that happened to mention the ramp through a window pulled in a full
  // airframe specification -- and a paragraph about strut placement in the
  // prompt makes the aircraft the subject whether or not it was meant to be.
  return /\baircraft|airplane|aeroplane|\bplane\b|cockpit|cowling|propeller|trainer\b/i.test(
    brief.subject,
  );
}
