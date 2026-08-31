import { z } from "zod";

/**
 * Vector's response contract.
 *
 * The product rule this file exists to enforce: **Vector never returns prose
 * for the UI to dump on screen.** It returns a typed object, and the client
 * renders native components from it. Markdown is not a UX.
 *
 * That distinction is what separates a premium product that happens to use a
 * model from a chat transcript with cards drawn around it. It also makes the
 * output testable, keeps length under control by construction rather than by
 * asking the model nicely, and lets attribution stay structural -- `evidence`
 * carries WHO said each thing, so the renderer can style an instructor quote
 * differently from Vector's own inference without parsing sentences.
 *
 * Long-form explanation is still available, but it lives in `detail` behind
 * an explicit "Explain more" -- never in the default view.
 */

export const VECTOR_CARD_KINDS = [
  "explanation",
  "recommendation",
  "recurrence",
  "perception_gap",
  "next_flight",
  "progress",
] as const;

export type VectorCardKind = (typeof VECTOR_CARD_KINDS)[number];

/** Who is speaking. The renderer styles each differently; never blur them. */
export const EVIDENCE_SOURCES = ["instructor", "student", "vector", "faa"] as const;
export type EvidenceSource = (typeof EVIDENCE_SOURCES)[number];

/**
 * The only visual classes Vector may reference. Each one is something that
 * exists independently of the answer being generated.
 *
 * FLIGHT_DATA      2D/3D path, telemetry chart, attempt overlay, replay, moment
 * SOURCE_MATERIAL  FAA / ACS / POH material we are licensed to show
 * CURATED_MEDIA    AfterFlight-owned, instructor-reviewed diagrams and video
 * USER_MEDIA       the student's own cockpit or POV recording
 * DATA_PLOT        a chart computed from real numbers
 *
 * There is deliberately no GENERATED_DIAGRAM member. Adding one would be the
 * whole failure mode in a single line.
 */
export const VECTOR_VISUAL_KINDS = [
  "FLIGHT_DATA",
  "SOURCE_MATERIAL",
  "CURATED_MEDIA",
  "USER_MEDIA",
  "DATA_PLOT",
] as const;

export const vectorCardSchema = z.object({
  kind: z.enum(VECTOR_CARD_KINDS).default("explanation"),
  /** Short. Rendered as the card headline -- 2 to 6 words. */
  title: z.string().default("Vector"),
  /** One or two sentences. The whole answer, if the student reads nothing else. */
  summary: z.string().default(""),
  /** Attributed quotes and observations. Empty is fine; invented is not. */
  evidence: z
    .array(
      z.object({
        source: z.enum(EVIDENCE_SOURCES),
        /** "Jake", "You", "Vector", "FAA Airplane Flying Handbook" */
        label: z.string(),
        text: z.string(),
      }),
    )
    .default([]),
  /** Three to five. Rendered as a list, never as a paragraph. */
  keyPoints: z.array(z.string()).default([]),
  /** Optional stat pair for recurrence/progress cards -- e.g. "3 lessons", "2 instructors". */
  stats: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
  /** One CTA. Not three. */
  nextAction: z.object({ label: z.string(), target: z.string().nullable().default(null) }).nullable().default(null),
  /** Long-form, shown only behind "Explain more". */
  detail: z.string().nullable().default(null),

  /**
   * An optional visual, and the rules that make one legal.
   *
   * Vector may not draw. It may only POINT AT something that already exists:
   * this student's own flight data, an authoritative source, curated media
   * AfterFlight owns, the student's own recordings, or a chart plotted from
   * real numbers. A generated SVG of a runway, an attitude indicator, a
   * control position or an aerodynamic vector is forbidden -- not because it
   * would look bad, but because it would look AUTHORITATIVE while being
   * invented, and a student cannot tell the difference.
   *
   * `source` is required by the schema rather than optional, so a visual with
   * no provenance cannot be represented at all. That is deliberate: an
   * optional field would eventually be omitted, and the whole guarantee rests
   * on every visual being able to say where it came from.
   *
   * When no trustworthy visual exists the answer is text. A concise accurate
   * explanation always beats an impressive graphic nobody can vouch for.
   */
  visual: z
    .object({
      kind: z.enum(VECTOR_VISUAL_KINDS),
      /** Where it renders from -- a flight id, segment id, or asset key. */
      ref: z.string(),
      /** Shown to the student verbatim, e.g. "Your Aug 29 flight data". */
      source: z.string(),
      caption: z.string().default(""),
    })
    .nullable()
    .default(null),
});

export type VectorCard = z.infer<typeof vectorCardSchema>;

/** Sent to the model. Kept in one place so prompt and parser cannot drift. */
export const RESPONSE_SHAPE_INSTRUCTION = `Respond with ONLY a JSON object, no prose around it, matching:

{
  "kind": "explanation" | "recommendation" | "recurrence" | "perception_gap" | "next_flight" | "progress",
  "title": "2-6 words",
  "summary": "1-2 sentences. The whole answer if she reads nothing else.",
  "evidence": [{ "source": "instructor"|"student"|"vector"|"faa", "label": "Jake"|"You"|"Vector"|"FAA Airplane Flying Handbook", "text": "..." }],
  "keyPoints": ["3-5 short items, each one line"],
  "stats": [{ "value": "3", "label": "lessons" }],
  "nextAction": { "label": "Chair-fly this", "target": null } | null,
  "detail": "Longer explanation, only if genuinely useful. Otherwise null."
}

Hard rules:
- summary is never more than two sentences.
- keyPoints are phrases, not paragraphs. Five maximum.
- Every quote from her instructor goes in evidence with source "instructor". Never put an instructor quote in summary or keyPoints as if it were your own words.
- Your own inference is source "vector".
- Use stats only for recurrence and progress cards.
- Exactly one nextAction, or null.`;
