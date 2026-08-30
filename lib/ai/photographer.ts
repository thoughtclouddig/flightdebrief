import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { extractJson } from "./extract-json";
import type { ArtBrief } from "./art-direction";
import type { AircraftSpec } from "./aircraft-advisor";

/**
 * The photographer, and the photo editor who checks their work.
 *
 * Splitting these off from art direction is the same move as splitting the
 * writer from the fact-checker. The art director decides WHAT the picture is
 * about -- a subject drawn from this specific article. The photographer
 * decides HOW it is made: lens, distance, angle, depth, where the light comes
 * from, how it is graded. One brief can be shot a dozen ways, and the
 * difference between a good image and a stock one lives almost entirely in
 * the second decision.
 *
 * Then the photo editor looks at the actual frame. Everything upstream is
 * text describing an image that does not exist yet; this is the only step
 * that sees what came back. A rule in a prompt is a request, and image models
 * put people in cockpits anyway. Checking the pixels is what makes "no
 * people" enforceable rather than aspirational.
 */

const MODEL = "claude-sonnet-5";
const REQUEST_TIMEOUT_MS = 30_000;

const shotSchema = z.object({
  lens: z.string().default("").catch(""),
  framing: z.string().default("").catch(""),
  composition: z.string().default("").catch(""),
  grade: z.string().default("").catch(""),
});

const PHOTOGRAPHER = `You are a photographer shooting one frame for a flight-training article. The subject and the light are already decided. You decide how it is shot.

Make the choices a real photographer makes:

LENS -- a focal length and aperture, and what that does. A 24mm close to the subject puts the viewer inside the scene; a 135mm from across the ramp compresses the hangar row behind it. Choose one because it serves this subject, not because it sounds impressive.

FRAMING -- where you stand. Height, distance, angle. Low and close to a nosewheel is a different picture from eye level ten feet back.

COMPOSITION -- what makes the frame work. Leading lines down a taxiway, the aircraft placed off-centre against open sky, a foreground element the eye enters through, negative space that gives the subject room.

GRADE -- the colour. Warm and luminous. Think a well-graded film still: deep saturated sky, clean warm highlights, shadows that stay open rather than crushing to black. Never desaturated, never grey, never washed out.

THE LOOK IS BRIGHT AND CINEMATIC
Wide, generous, sunlit. A reader should want to be there. This illustrates articles about getting better at flying, so the frame should feel like the good part of a flying day, not the end of a hard one.

CONSTRAINTS YOU CANNOT SHOOT AROUND
- No people. No hands, no silhouettes, no figures anywhere, however distant.
- No legible instruments, avionics screens, gauge faces, placards, signage, or tail numbers in focus. These render as gibberish and are the first thing a reader clocks as machine-made.
- No stock-photo cliches: sunset silhouettes, arms raised, a compass rose, a paper map with coffee.

Return ONLY this JSON, no fences:

{"lens": "focal length, aperture, and effect", "framing": "where the camera is", "composition": "what makes the frame work", "grade": "the colour treatment"}`;

/** Turns an art brief into the prompt the image model actually receives. */
export async function composeShot(brief: ArtBrief, aircraft?: AircraftSpec | null): Promise<string> {
  const assemble = (shot: z.infer<typeof shotSchema>) =>
    [
      "Cinematic photograph, shot on film, anamorphic.",
      shot.lens,
      `${brief.subject} ${brief.light}`,
      shot.framing,
      shot.composition,
      shot.grade,
      // The aircraft spec goes in verbatim rather than paraphrased. It is the
      // one part of this prompt that is a matter of fact rather than taste,
      // and rewording "one engine in the nose" is how it stops being true.
      aircraft ? `The aircraft is a ${aircraft.aircraft}. ${aircraft.configuration} ${aircraft.avoid}` : "",
      "Radiant natural light, rich saturated colour, high dynamic range, crisp and luminous.",
      "Bright and optimistic, never grey or gloomy.",
      "No people anywhere in frame. No text, no legible instruments, no logos.",
      "A real moment, beautifully lit -- not a stock photo.",
    ]
      .filter(Boolean)
      .join(" ");

  const fallback = assemble({
    lens: "35mm at f/2.8, close enough to feel present without distorting.",
    framing: "Eye level, a few feet back, the subject slightly off centre.",
    composition: "Open space on one side, a clean line leading the eye in.",
    grade: "Warm highlights, deep blue sky, open shadows.",
  });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback;

  try {
    const client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: PHOTOGRAPHER,
      messages: [
        {
          role: "user",
          content: `Subject: ${brief.subject}
Light: ${brief.light}
${aircraft ? `Aircraft: ${aircraft.aircraft} -- ${aircraft.configuration}` : ""}

Shoot it.`,
        },
      ],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("no text");
    const shot = shotSchema.parse(JSON.parse(extractJson(textBlock.text)));
    if (!shot.lens.trim() && !shot.framing.trim()) throw new Error("empty shot");
    return assemble(shot);
  } catch (err) {
    // A competently shot default beats blocking the article on the camera
    // department.
    console.error("[photographer] failed, using the default shot:", err);
    return fallback;
  }
}

const verdictSchema = z.object({
  usable: z.boolean().default(true).catch(true),
  problems: z.array(z.string()).default([]).catch([]),
  fix: z.string().default("").catch(""),
});

export interface PhotoVerdict {
  usable: boolean;
  problems: string[];
  /** What to change on a reshoot, in the photographer's terms. */
  fix: string;
}

const PHOTO_EDITOR = `You are a photo editor. You are looking at one generated image intended to run as the hero on a flight-training article. Decide whether it can be published.

REJECT it if any of these are true:
- A person is visible. ANY part of one. A hand holding a pen is a person. Fingers at the edge of frame are a person. A forearm, a shoulder, a leg, a silhouette, a reflection in glass or metal -- all people. This is the rule that gets broken most often and it is not a matter of degree: if any human body part is in the frame, reject it. Look at the hands specifically before deciding, because a hand entering frame to hold or write something is the commonest version and the easiest to read past.
- Text appears anywhere and is legible or half-legible: signage, placards, avionics readouts, tail numbers, watermarks. Garbled lettering is worse than none.
- An instrument panel or avionics display is readable enough to look wrong.
- It is dark, grey, gloomy, washed out, or flat. The brief is bright and cinematic.
- It reads as generic stock photography rather than a specific moment.
- The aircraft is wrong in a way a pilot would notice. Check this deliberately rather than glancing at it, because it is the failure that gets published:
  - Propellers. A single-engine aeroplane has ONE propeller, on the NOSE. Not on a wing, not two of them, not one facing backwards. A twin has one on each wing, both facing forward. A propeller anywhere else is an automatic reject.
  - Wings. Attached at the top or the bottom of the fuselage, not the middle, and not merging into it. Struts, if present, run from the lower fuselage to the underside of the wing.
  - Landing gear. Three wheels, arranged either as two mains plus a nosewheel or two mains plus a tailwheel. Never both. Never floating clear of the airframe.
  - General geometry: a tail that attaches to nothing, a cabin with no way in, doubled or half-melted surfaces.
- The aircraft is a Cessna 172 when the brief specified something else. The type in the brief is the type in the frame.
- THE CONNECTION IS A METAPHOR RATHER THAN A SUBJECT. You are told why the picture was commissioned. If that reason is symbolic -- a lone aircraft "reflecting" isolation, open sky "evoking" freedom -- reject it. The picture must show something the article literally discusses. A generic photograph with a poetic justification is the commonest way a wrong image gets published, precisely because it reads as intentional.
- IT IS NOT ABOUT THIS ARTICLE. You are given the title and what the picture was commissioned to show. Ask whether a reader who read the article would recognise this photograph as belonging to it. Then ask the harder question: could this same image sit on top of a DIFFERENT article about flight training and work just as well? If it could, reject it -- an interchangeable image is a failed image however handsome it is, and a run of them is what made the last set of these look generic.

Be strict. A borderline image is a reject -- these run at the top of the page and are the first thing a reader judges.

If you reject it, say what to change in terms a photographer can act on. Not "make it better" but "move the camera outside the aircraft so no seats are in frame".

Return ONLY this JSON, no fences:

{"usable": true or false, "problems": ["what is wrong"], "fix": "what to shoot instead"}`;

/**
 * Looks at the generated frame and decides whether it can run.
 *
 * The only step in the pipeline that sees an actual image. Everything before
 * it is text about a picture that does not exist yet, which is why "no
 * people" kept failing: it was a request, not a check.
 *
 * Defaults to usable on any failure. A review that cannot run should not cost
 * the article its picture -- this is a filter on quality, not a gate on
 * publishing.
 */
export async function reviewPhotograph(pngBase64: string, brief?: ArtBrief): Promise<PhotoVerdict> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { usable: true, problems: [], fix: "" };

  try {
    const client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: PHOTO_EDITOR,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/png", data: pngBase64 } },
            {
              type: "text",
              text: brief
                ? `This is the hero for an article titled "${brief.title}".\n` +
                  `It was commissioned as: ${brief.subject}\n` +
                  (brief.connection ? `Because: ${brief.connection}\n` : "") +
                  `\nCan it run?`
                : "Can this run?",
            },
          ],
        },
      ],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("no text");
    return verdictSchema.parse(JSON.parse(extractJson(textBlock.text)));
  } catch (err) {
    // Accepting on failure is deliberate -- a review that cannot run should
    // not cost the article its picture -- but it must not look like a pass.
    // A silently-accepted image is indistinguishable from a checked one, and
    // that is how a photograph with a hand in it reached the page.
    console.error("[photo-editor] review FAILED TO RUN, accepting unchecked:", err);
    return { usable: true, problems: ["photo editor did not run -- image is unchecked"], fix: "" };
  }
}
