import { describe, expect, it } from "vitest";
import { buildSeed } from "./seed";
import { filterTrainingItemDescriptions } from "@/lib/training-item-quality";
import { hashString } from "@/lib/geo";

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

/**
 * Reseed-duplicate regression. toTrainingItems() used to derive each item's
 * id from its position in the (already-filtered) array
 * (`${debriefId}-keep-${n++}`). Dropping an earlier item shifted every
 * later item's index -- a surviving item got a "new" id on the next reseed,
 * ON CONFLICT (id) DO NOTHING didn't recognize it as already-seeded, and it
 * got inserted a second time alongside the original. That's exactly what
 * happened in Development: fixing the quality-filter bug above changed
 * which items survive, and the very next reseed duplicated every item that
 * shifted position as a result.
 */
describe("buildSeed — TrainingItem ids are content-derived, never position-derived", () => {
  it("is fully deterministic -- two calls to buildSeed() produce byte-identical TrainingItem rows, ids included", () => {
    const a = buildSeed();
    const b = buildSeed();
    expect(a.trainingItems).toEqual(b.trainingItems);
  });

  it("no two TrainingItem rows share an id -- a reseed can never silently collide two distinct items", () => {
    const seed = buildSeed();
    const ids = seed.trainingItems.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("a known surviving item's id is derived from (debriefId, category, description) only -- proven against the exact real formula, not just 'it didn't crash'", () => {
    const seed = buildSeed();
    const radioSentence = "I need to work on talking on the radio more confidently during the emergency scenario.";
    const item = seed.trainingItems.find((t) => t.debriefId === "debrief-2" && t.description === radioSentence);
    expect(item).toBeDefined();
    // Same formula lib/data/seed.ts's stableTrainingItemId uses -- this fails
    // loudly if that function's shape (or its inputs) ever changes back to
    // depending on array position.
    expect(item!.id).toBe(`debrief-2-keep-${hashString(radioSentence)}`);
  });
});
