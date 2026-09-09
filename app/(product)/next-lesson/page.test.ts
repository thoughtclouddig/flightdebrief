import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * NextLessonPage is an async Server Component coupled to real repository
 * access -- too heavy to render in a unit test. The pure evidence-selection
 * logic it calls (deriveNextFlightFocus/deriveKeepBuilding) has its own full
 * coverage in lib/next-flight-focus.test.ts; instructorAttributionLabel() in
 * lib/instructor-attribution.test.ts; assessTranscriptAdequacy() in
 * lib/transcript-adequacy.test.ts. This is static source proof that the
 * page actually wires those into the right places -- matches this
 * codebase's existing static-source-scan precedent for DB-coupled Server
 * Components.
 */
const SOURCE = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("Next Flight page — never implies an instructor when brief.lastInstructor is null", () => {
  it("resolves attribution via instructorAttributionLabel, not resolveCfiFirstName's ambiguous null alone", () => {
    expect(SOURCE).toMatch(/instructorAttributionLabel\(brief\.lastInstructor\)/);
  });

  it("the page kicker is conditional on cfi, not an unconditional 'with ${cfi}' template", () => {
    expect(SOURCE).toMatch(/kicker=\{cfi \? `Based on your debrief with \$\{cfi\}` : "Based on your latest debrief"\}/);
  });

  it("the 'Ask your instructor' section title is conditional on cfi", () => {
    expect(SOURCE).toMatch(/title=\{cfi \? "Ask your instructor" : "Worth thinking about"\}/);
  });
});

describe("Next Flight page — no participant 'we' language anywhere in the copy", () => {
  it("never uses 'we' or 'our' as if AfterFlight flew the aircraft", () => {
    // Legitimate system-voice "we" (e.g. "we couldn't build a plan") is not
    // present in this file at all -- unlike debrief-recorder.tsx's mic
    // warning, this page has no such copy, so a bare absence check is safe.
    expect(SOURCE).not.toMatch(/\bwe\b/i);
    expect(SOURCE).not.toMatch(/\bour\b/i);
  });
});

describe("Next Flight page — evidence hierarchy uses only real, attributable data", () => {
  it("re-checks the last debrief's transcript adequacy before trusting its free-text AI fields", () => {
    expect(SOURCE).toMatch(/assessTranscriptAdequacy\(brief\.lastDebrief\.transcript\)/);
  });

  it("gates focus/keep-building derivation on real ratings, not raw AI text alone", () => {
    expect(SOURCE).toMatch(/deriveNextFlightFocus\(/);
    expect(SOURCE).toMatch(/deriveKeepBuilding\(/);
  });

  it("fetches the student's own last-flight self-assessment as real grounding evidence", () => {
    expect(SOURCE).toMatch(/repo\.getAssessment\(brief\.lastFlight\.id, "student"\)/);
  });

  it("only offers to Review a skill from the recurring-theme tier, never from a free-text focus headline", () => {
    expect(SOURCE).toMatch(/focus\?\.kind === "recurring_theme" && focus\.skill/);
  });

  it("the empty state is honest about insufficient evidence, not filled with generic prose", () => {
    expect(SOURCE).toMatch(/Not enough was captured from your last debrief to build a next-flight plan/);
  });
});
