import { describe, expect, it } from "vitest";
import { suggestStudyReferences } from "@/lib/topics";

describe("suggestStudyReferences", () => {
  it("attaches the literal sentence that triggered each match as `why`", () => {
    const sentences = ["Carried extra airspeed on final and floated during the landing.", "Everything else looked solid."];
    const references = suggestStudyReferences(sentences);

    expect(references.length).toBeGreaterThan(0);
    expect(references[0].why).toBe(sentences[0]);
  });

  it("returns no references when nothing in the sentences matches the topic library", () => {
    expect(suggestStudyReferences(["Great flight, nothing to add."])).toEqual([]);
  });

  it("caps results at 5 and never returns duplicate sources", () => {
    const sentences = [
      "Floated on final due to excess airspeed.",
      "Missed a radio call from tower.",
      "Got behind the aircraft configuring for the pattern.",
      "Bounced the landing in the crosswind.",
      "Struggled with short field technique.",
      "Went around because traffic was on the runway.",
    ];
    const references = suggestStudyReferences(sentences);

    expect(references.length).toBeLessThanOrEqual(5);
    expect(new Set(references.map((r) => r.source)).size).toBe(references.length);
  });
});
