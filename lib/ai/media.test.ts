import { describe, expect, it } from "vitest";
import {
  CURATED_MEDIA,
  MEDIA_SOURCE_CLASSES,
  retrieveMedia,
  vectorMediaSchema,
} from "@/lib/ai/media";

/**
 * These are guard tests, not coverage tests. Each one fails loudly if a future
 * change quietly removes the property that makes Vector's visuals safe to
 * trust -- which is the only kind of regression here that matters, because it
 * would not look like a bug on screen.
 */
describe("media provenance", () => {
  it("refuses a media block with no source", () => {
    const withoutSource = {
      mediaId: "x",
      format: "IMAGE",
      sourceClass: "FAA",
      title: "Something",
      source: "",
      ref: "/a.png",
    };
    expect(vectorMediaSchema.safeParse(withoutSource).success).toBe(false);
  });

  it("refuses a media block with no ref to render from", () => {
    const withoutRef = {
      mediaId: "x",
      format: "IMAGE",
      sourceClass: "FAA",
      title: "Something",
      source: "FAA Airplane Flying Handbook",
      ref: "",
    };
    expect(vectorMediaSchema.safeParse(withoutRef).success).toBe(false);
  });

  it("has no source class meaning 'we generated this'", () => {
    // The whole guarantee is that every visual traces to something a human
    // vouched for. A GENERATED_* member would be the failure mode in one line.
    for (const cls of MEDIA_SOURCE_CLASSES) {
      expect(cls).not.toMatch(/GENERATED|SYNTHETIC|AI_/);
    }
  });

  it("rejects an invented source class", () => {
    const invented = {
      mediaId: "x",
      format: "IMAGE",
      sourceClass: "GENERATED_DIAGRAM",
      title: "Crosswind",
      source: "Vector",
      ref: "/a.svg",
    };
    expect(vectorMediaSchema.safeParse(invented).success).toBe(false);
  });
});

describe("media retrieval", () => {
  it("prefers the student's own flight over library media", () => {
    const media = retrieveMedia({
      skill: "crosswind-landing",
      flightId: "aug-29",
      segmentId: "approach-2",
      ownFlightDemonstrates: true,
    });
    expect(media?.sourceClass).toBe("USER_FLIGHT_DATA");
    expect(media?.source).toBe("Your own flight data");
  });

  it("never surfaces an asset that has not been reviewed", () => {
    // Every seeded asset is DRAFT, so retrieval must come back empty rather
    // than showing an animation nobody has signed off.
    expect(CURATED_MEDIA.every((a) => a.reviewStatus !== "ACTIVE")).toBe(true);
    expect(retrieveMedia({ skill: "crosswind-landing" })).toBeNull();
  });

  it("returns null rather than inventing something when nothing matches", () => {
    expect(retrieveMedia({ skill: "no-such-skill" })).toBeNull();
    expect(retrieveMedia({ skill: null })).toBeNull();
  });
});
