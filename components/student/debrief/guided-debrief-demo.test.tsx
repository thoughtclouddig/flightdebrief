import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Same no-jsdom-harness situation as add-flight-demo.test.tsx -- static proof the selected skills actually drive the assessment, not a render. */
const SOURCE = readFileSync(new URL("./guided-debrief-demo.tsx", import.meta.url), "utf8");

describe("GuidedDebriefDemo — rates whatever the student actually selected on Add Flight", () => {
  it("reads the hand-off from Add Flight instead of only ever using the fixed fixture list", () => {
    expect(SOURCE).toMatch(/import\s*\{\s*readDemoSkillSelection\s*\}\s*from\s*"@\/lib\/prototype-fixtures\/demo-skill-selection"/);
  });

  it("falls back to Mia's existing fixture story when reached directly (no prior Add Flight selection)", () => {
    expect(SOURCE).toMatch(/const DEFAULT_OBJECTIVES = PERCEPTION_GAPS\.map/);
    expect(SOURCE).toMatch(/stored\.length > 0 \? stored\.map\(\(t\) => t\.label\) : DEFAULT_OBJECTIVES/);
  });

  it("objectives is computed once, at mount, not a static module-level constant anymore", () => {
    expect(SOURCE).not.toMatch(/^const OBJECTIVES = /m);
    expect(SOURCE).toMatch(/const \[objectives\] = useState<string\[\]>/);
  });

  it("threads the real selection into every stage that rates or displays it", () => {
    expect(SOURCE).toMatch(/<Objectives objectives=\{objectives\}/);
    expect(SOURCE).toMatch(/objectives=\{objectives\}\s*\n\s*ratings=\{studentRatings\}/);
    expect(SOURCE).toMatch(/objectives=\{objectives\}\s*\n\s*ratings=\{instructorRatings\}/);
    expect(SOURCE).toMatch(/<Reveal objectives=\{objectives\}/);
  });

  it("Assess and Reveal rate the objectives prop, not the old module-level constant", () => {
    expect(SOURCE).not.toMatch(/OBJECTIVES\.every|OBJECTIVES\.filter|OBJECTIVES\.map/);
  });
});
