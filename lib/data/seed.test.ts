import { describe, expect, it } from "vitest";
import { buildSeed } from "./seed";
import { filterTrainingItemDescriptions } from "@/lib/training-item-quality";

/**
 * toTrainingItems() used to build seeded TrainingItem rows straight from the
 * mock analyzer's raw needsWork/actionItems output, with no call to
 * filterTrainingItemDescriptions() -- the same narrative-recap quality gate
 * a real live debrief (app/api/debrief/analyze/route.ts) always goes
 * through. That let a narrative recap ("Danny walked me through an
 * engine-out simulation and had me pick a field and run the checklist.")
 * survive as a real "wanted you to work on" / "prepare before you fly" item
 * on Next Flight -- something a genuinely analyzed debrief could never
 * produce.
 */
describe("buildSeed — TrainingItem descriptions never bypass the narrative-recap quality gate", () => {
  it("never seeds the specific narrative recap this bug shipped with", () => {
    const seed = buildSeed();
    const descriptions = seed.trainingItems.map((t) => t.description);
    expect(descriptions).not.toContain(
      "Danny walked me through an engine-out simulation and had me pick a field and run the checklist.",
    );
  });

  it("every seeded TrainingItem description survives the same filter a real analyzed debrief applies", () => {
    const seed = buildSeed();
    const descriptions = seed.trainingItems.map((t) => t.description);
    expect(filterTrainingItemDescriptions(descriptions)).toEqual(descriptions);
  });
});
