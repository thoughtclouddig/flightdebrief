import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * NextLessonPage is an async Server Component coupled to real repository
 * access -- too heavy to render in a unit test (instructorAttributionLabel()
 * itself has its own full coverage in lib/instructor-attribution.test.ts).
 * Static source proof that a real Solo flight (flight.instructor === null,
 * which produces brief.lastInstructor === null) can never reach the
 * unconditional "with your instructor" copy that shipped here before this
 * fix -- matches this codebase's existing static-source-scan precedent for
 * DB-coupled Server Components (e.g. components/school-v2/route-
 * containment.test.tsx, app/(product)/flights/[id]/debrief/page.test.ts).
 */
const SOURCE = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("Next Flight page — never implies an instructor when brief.lastInstructor is null", () => {
  it("resolves attribution via instructorAttributionLabel, not resolveCfiFirstName's ambiguous null alone", () => {
    expect(SOURCE).toMatch(/instructorAttributionLabel\(brief\.lastInstructor\)/);
  });

  it("the page kicker is conditional on cfi, not an unconditional 'with ${cfi}' template", () => {
    expect(SOURCE).toMatch(/kicker=\{cfi \? `Based on your debrief with \$\{cfi\}` : "Based on your latest debrief"\}/);
  });

  it("the 'wanted you to work on' section title is conditional on cfi", () => {
    expect(SOURCE).toMatch(/title=\{cfi \? `\$\{cfi\} wanted you to work on` : "What to work on"\}/);
  });

  it("the 'Ask your instructor' section title is conditional on cfi", () => {
    expect(SOURCE).toMatch(/title=\{cfi \? "Ask your instructor" : "Worth thinking about"\}/);
  });

  it("the empty-state fallback text is conditional on cfi, not the removed hasInstructor variable", () => {
    expect(SOURCE).not.toMatch(/hasInstructor/);
    expect(SOURCE).toMatch(/\{cfi\s*\n?\s*\?\s*`\$\{cfi\} hasn't set anything/);
  });
});
