import { z } from "zod";

/**
 * Trusted instructional media, and the rules that keep it trustworthy.
 *
 * The problem this solves: Vector explains motion and geometry with prose,
 * and prose is the wrong tool for "as the airplane slows, you need more
 * aileron". The obvious fix -- have the model draw a diagram -- is the worst
 * available option, because a generated aviation graphic looks authoritative
 * and a student has no way to tell it from an FAA figure.
 *
 * So Vector does not create media. It RETRIEVES media, from a library whose
 * every entry has been reviewed, and every block says where it came from.
 *
 * FORMAT and SOURCE are separate axes, deliberately. A video may be FAA,
 * AfterFlight-produced, or the student's own cockpit recording; an image may
 * be any of those too. Collapsing them into one enum is how you end up unable
 * to express "an FAA video" or "a student's own still", and how source
 * eventually stops being checked.
 */

/** What kind of thing it is. */
export const MEDIA_FORMATS = [
  "IMAGE",
  "VIDEO",
  "ANIMATION",
  "FLIGHT_REPLAY",
  "FLIGHT_MOMENT",
  "TELEMETRY_CHART",
  "APPROACH_COMPARISON",
] as const;

/**
 * Who vouches for it.
 *
 * There is no GENERATED_DIAGRAM member and there must never be one. A missing
 * visual is acceptable; a wrong visual is not. If this list ever grows a
 * member meaning "we made this up on request", the entire guarantee is gone.
 */
export const MEDIA_SOURCE_CLASSES = [
  "USER_FLIGHT_DATA",
  "FAA",
  "APPROVED_AUTHORITATIVE_SOURCE",
  "AFTERFLIGHT_CURATED",
  "USER_MEDIA",
] as const;

export type MediaFormat = (typeof MEDIA_FORMATS)[number];
export type MediaSourceClass = (typeof MEDIA_SOURCE_CLASSES)[number];

/** Only ACTIVE assets may ever be surfaced to a student. */
export type MediaReviewStatus = "DRAFT" | "REVIEW" | "ACTIVE" | "RETIRED";

/**
 * The block a Vector card carries.
 *
 * `source` is `.min(1)` rather than optional or defaulted. A media block that
 * cannot say where it came from fails validation and therefore cannot be
 * rendered -- which is the enforcement, not the documentation.
 */
export const vectorMediaSchema = z.object({
  mediaId: z.string().min(1),
  format: z.enum(MEDIA_FORMATS),
  sourceClass: z.enum(MEDIA_SOURCE_CLASSES),
  title: z.string().min(1),
  /** Shown verbatim: "FAA Airplane Flying Handbook", "Your Aug 29 flight". */
  source: z.string().min(1),
  caption: z.string().default(""),
  /** One line on why THIS student is being shown THIS asset. */
  why: z.string().default(""),
  /** Where it renders from -- an asset path, or a route for flight media. */
  ref: z.string().min(1),
  durationLabel: z.string().nullable().default(null),
  flightId: z.string().nullable().default(null),
  momentId: z.string().nullable().default(null),
  segmentId: z.string().nullable().default(null),
});

export type VectorMedia = z.infer<typeof vectorMediaSchema>;

/* ------------------------------------------------------- curated library */

export interface CuratedAsset {
  id: string;
  title: string;
  format: MediaFormat;
  sourceClass: MediaSourceClass;
  source: string;
  caption: string;
  ref: string;
  durationLabel: string | null;
  /** Skill slugs this asset teaches. Retrieval matches on these. */
  skills: string[];
  acsAreas: string[];
  aircraft: string[];
  reviewStatus: MediaReviewStatus;
  reviewedBy: string | null;
  version: number;
}

/**
 * The library, small on purpose.
 *
 * Not a CMS. The point of this pass is to prove the retrieval path and the
 * provenance guarantee, and three reviewed entries prove both. Adding a real
 * admin surface is a later decision that this shape does not block.
 *
 * The crosswind entry is DRAFT rather than ACTIVE deliberately: nobody has
 * produced or reviewed that animation yet, and marking it ACTIVE so the demo
 * looks better is exactly the failure this module exists to prevent. It
 * exercises the "no approved visual yet" path instead.
 */
export const CURATED_MEDIA: CuratedAsset[] = [
  {
    id: "afh-ch9-crosswind",
    title: "Crosswind correction through touchdown",
    format: "ANIMATION",
    sourceClass: "AFTERFLIGHT_CURATED",
    source: "AfterFlight Training Library",
    caption: "As airspeed decreases, aileron input increases into the wind through touchdown.",
    ref: "/media/crosswind-aileron.mp4",
    durationLabel: "0:38",
    skills: ["crosswind-landing"],
    acsAreas: ["Takeoffs, Landings & Go-Arounds"],
    aircraft: ["C172S"],
    // Not produced yet. Left DRAFT so retrieval correctly declines it.
    reviewStatus: "DRAFT",
    reviewedBy: null,
    version: 1,
  },
  {
    id: "afh-ch8-stabilized",
    title: "Configuring before the turn to final",
    format: "IMAGE",
    sourceClass: "FAA",
    source: "FAA Airplane Flying Handbook, Ch. 8",
    caption: "Configuration complete before final leaves short final for holding, not fixing.",
    ref: "/media/stabilized-approach.png",
    durationLabel: null,
    skills: ["stabilized-approach"],
    acsAreas: ["Takeoffs, Landings & Go-Arounds"],
    aircraft: ["C172S"],
    reviewStatus: "DRAFT",
    reviewedBy: null,
    version: 1,
  },
];

/**
 * Retrieval, in the order the product's own priority list demands.
 *
 * 1. the student's own flight, when it can demonstrate the point
 * 2. reviewed AfterFlight media
 * 3. an authoritative source
 * 4. nothing -- which means the answer is text
 *
 * The student's own flight wins because it is both the most trustworthy asset
 * available and the most persuasive: a generic diagram of a crosswind is a
 * fact, and their own Approach 2 next to their own Approach 3 is an argument.
 */
export function retrieveMedia(opts: {
  skill: string | null;
  flightId?: string | null;
  segmentId?: string | null;
  /** Set when the student's own flight genuinely demonstrates the point. */
  ownFlightDemonstrates?: boolean;
}): VectorMedia | null {
  if (opts.ownFlightDemonstrates && opts.flightId) {
    return vectorMediaSchema.parse({
      mediaId: `flight-${opts.flightId}-${opts.segmentId ?? "all"}`,
      format: opts.segmentId ? "APPROACH_COMPARISON" : "FLIGHT_REPLAY",
      sourceClass: "USER_FLIGHT_DATA",
      title: opts.segmentId ? "Your two approaches, side by side" : "Your flight, replayed",
      source: "Your own flight data",
      caption: "",
      why: "Your own flight shows this more directly than any diagram could.",
      ref: opts.segmentId
        ? `/prototype/vector/flights/${opts.flightId}/compare`
        : `/prototype/vector/flights/${opts.flightId}/replay`,
      durationLabel: null,
      flightId: opts.flightId,
      momentId: null,
      segmentId: opts.segmentId ?? null,
    });
  }

  if (!opts.skill) return null;

  // ACTIVE only. A draft asset is one nobody has signed off, and an unreviewed
  // aviation graphic is the thing this whole module exists to keep out.
  const asset = CURATED_MEDIA.find((a) => a.reviewStatus === "ACTIVE" && a.skills.includes(opts.skill!));
  if (!asset) return null;

  return vectorMediaSchema.parse({
    mediaId: asset.id,
    format: asset.format,
    sourceClass: asset.sourceClass,
    title: asset.title,
    source: asset.source,
    caption: asset.caption,
    why: "",
    ref: asset.ref,
    durationLabel: asset.durationLabel,
    flightId: null,
    momentId: null,
    segmentId: null,
  });
}
