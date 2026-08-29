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

const SYSTEM = `You are a general aviation expert advising an image team. They are photographing one frame for a flight-training article. Your job is to make sure the aircraft in it is a real aircraft, correctly configured, and not the same one they used last time.

PICK A SPECIFIC TYPE

Choose from the fleet you are given and name it exactly. Not "a small plane", not "a training aircraft" -- "Piper PA-28-181 Archer" or "Diamond DA40 NG".

Vary it. If the subject does not demand a particular airframe, deliberately choose something other than a Cessna 172: it is the default an image model reaches for unprompted, and a publication where every aircraft is a 172 reads as though nobody involved has been to an airport. Match the type to the article where it matters -- a twin for a multi-engine subject, a tailwheel for stick-and-rudder work, a glass-panel type for avionics -- and otherwise pick for variety.

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
  if (!apiKey) return FALLBACK;

  try {
    const client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Subject: ${brief.subject}
Light: ${brief.light}

Fleet to choose from:
${TRAINING_FLEET.map((a) => `- ${a}`).join("\n")}

Which aircraft, and how must it be built?`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("no text");
    const spec = specSchema.parse(JSON.parse(extractJson(textBlock.text)));
    if (!spec.aircraft.trim()) throw new Error("no aircraft named");
    return {
      aircraft: spec.aircraft.trim(),
      configuration: spec.configuration.trim() || FALLBACK.configuration,
      avoid: spec.avoid.trim() || FALLBACK.avoid,
    };
  } catch (err) {
    // A correct 172 beats an invented aeroplane, and beats blocking the
    // article on the technical adviser.
    console.error("[aircraft-advisor] failed, using the default type:", err);
    return FALLBACK;
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
  return /aircraft|airplane|aeroplane|plane|cessna|piper|cockpit|cowling|wing|propeller|ramp|tiedown|hangar|taxiway|runway/i.test(
    `${brief.subject} ${brief.light}`,
  );
}
