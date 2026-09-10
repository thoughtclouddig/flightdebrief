import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Client component with click-driven multi-stage state -- no jsdom/interaction harness in this repo (see vitest.config.mts), so this is static proof the real catalog is wired in, matching this codebase's established precedent for that situation. */
const SOURCE = readFileSync(new URL("./add-flight-demo.tsx", import.meta.url), "utf8");

describe("AddFlightDemo — What did you work on? uses the real skill catalog", () => {
  it("imports the real ACS-backed catalog, not a demo-only list", () => {
    expect(SOURCE).toMatch(/import\s*\{\s*allTrainingSkills,?\s*categoryLabel\s*\}\s*from\s*"@\/lib\/topics"/);
  });

  it("imports the real category ordering rather than a second, independently-maintained copy", () => {
    expect(SOURCE).toMatch(/import\s*\{\s*CATEGORY_ORDER\s*\}\s*from\s*"@\/components\/debrief\/task-picker-form"/);
  });

  it("no longer offers the old four fixed lesson categories as the training picker", () => {
    expect(SOURCE).not.toMatch(/FLIGHT_DEFAULTS\.recentLessons/);
  });

  it("supports multiple selections via a Set, not a single selected value", () => {
    expect(SOURCE).toMatch(/useState<Set<TrainingSkill>>/);
  });

  it("hands the real selection off to the debrief demo before continuing", () => {
    const saveIndex = SOURCE.indexOf("saveDemoSkillSelection(tasks)");
    const doneIndex = SOURCE.indexOf("onDone();", saveIndex);
    expect(saveIndex).toBeGreaterThan(-1);
    expect(doneIndex).toBeGreaterThan(saveIndex);
  });

  it("defaults to Mia's existing fixture story, mapped onto real catalog codes", () => {
    expect(SOURCE).toMatch(/MIA_DEFAULT_SKILLS[\s\S]*=[\s\S]*\[[\s\S]*"STABILIZED_APPROACH"[\s\S]*"SHORT_FIELD_LANDING"[\s\S]*"CROSSWIND_LANDING"[\s\S]*\]/);
  });

  it("carries the copy update: no longer claims two things AfterFlight 'can't look up'", () => {
    expect(SOURCE).toMatch(/Just two things to finish this flight/);
    expect(SOURCE).not.toMatch(/Two things we can't look up/);
  });

  it("carries the copy update: the section is titled What did you work on?, not Training", () => {
    expect(SOURCE).toMatch(/What did you work on\?/);
    expect(SOURCE).not.toMatch(/<>Training<\/>/);
  });
});
