import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * DebriefPage is an async Server Component coupled to real repository/auth
 * access -- too heavy to render in a unit test (the actual state-machine
 * logic it calls, computeDebriefProgress, has its own full test coverage in
 * lib/debrief-progress.test.ts). This is a static-source proof that the
 * architectural correction actually landed in this file, not just in the
 * extracted helper -- same approach components/school-v2/route-containment.test.tsx
 * already uses for a resolver this shape.
 */
const SOURCE = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("(product) debrief resolver — lifecycle driven by instructor presence, not guidanceMode", () => {
  it("no longer short-circuits freeform flights straight to the recorder before tasks/assessments", () => {
    // The old bug: `if (guidanceMode === "freeform") { return <DebriefRecorder ... /> }`
    // before ever reaching the tasks/assessment pipeline below.
    expect(SOURCE).not.toMatch(/if\s*\(\s*guidanceMode\s*===\s*["']freeform["']\s*\)\s*\{\s*\/\//);
    const freeformIndex = SOURCE.indexOf('guidanceMode === "freeform"');
    const tasksIndex = SOURCE.indexOf("listFlightTasks(id)");
    expect(tasksIndex).toBeGreaterThan(-1);
    expect(freeformIndex).toBeGreaterThan(tasksIndex);
  });

  it("computes hasInstructor from the flight itself, not from org.defaultGuidanceMode", () => {
    expect(SOURCE).toMatch(/hasInstructor\s*=\s*flight\.instructor\s*!==\s*null/);
  });

  it("gates the instructor-assessment redirect and the compare redirect on hasInstructor", () => {
    const hasInstructorGateCount = (SOURCE.match(/if\s*\(hasInstructor\)\s*\{/g) ?? []).length;
    expect(hasInstructorGateCount).toBeGreaterThanOrEqual(2); // the assessment-gating block + the compare redirect
    expect(SOURCE).toMatch(/redirect\(`\/flights\/\$\{id\}\/debrief\/compare`\)/);
  });

  it("canContinueDebrief is true unconditionally when there is no instructor -- solo never blocks on a second party", () => {
    expect(SOURCE).toMatch(/canContinueDebrief\s*=\s*\n?\s*!hasInstructor\s*\|\|/);
  });
});
