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

/**
 * DEV QA -- Next Flight preparation rewrite. "Focus for next flight" uses
 * the same computeRecommendedFocus ranking Train uses (not raw, un-ranked
 * brief.focusAreas); "Prepare before you fly" routes each real before-flight
 * item at a real activity (Radio Practice, Chair Fly) or shows plain
 * evidence text, never a checkbox standing in for proof of preparation;
 * curated FAA studyReferences attach as quiet citations, never their own
 * standalone reading-list section.
 */
describe("Next Flight page — preparation is evidence/activity-routed, not a checklist or reading list", () => {
  it("uses the shared computeRecommendedFocus ranking for the top focus, not raw un-ranked focusAreas", () => {
    expect(SOURCE).toMatch(/computeRecommendedFocus\(repo, brief\)/);
    expect(SOURCE).toMatch(/title="Focus for next flight"/);
    expect(SOURCE).not.toMatch(/title="Focus today"/);
    expect(SOURCE).not.toMatch(/focusToday/);
  });

  it("never renders TrainingItemChecklist -- no checkbox stands in for proof of preparation", () => {
    expect(SOURCE).not.toMatch(/TrainingItemChecklist/);
  });

  it("routes a radio-communications before-flight item at real Radio Practice via the shared skill taxonomy", () => {
    expect(SOURCE).toMatch(/matchSkills\(item\)/);
    expect(SOURCE).toMatch(/RADIO_COMMUNICATIONS/);
    expect(SOURCE).toMatch(/\/train\/radio-practice/);
  });

  it("only offers Chair Fly from the top focus when a real authored scenario exists (hasAuthoredScenario), never unconditionally", () => {
    expect(SOURCE).toMatch(/hasAuthoredScenario\(focus\.contested\.taskLabel\)/);
  });

  it("the 'Prepare before you fly' title replaces the removed 'Before today's flight' checklist section", () => {
    expect(SOURCE).toMatch(/title="Prepare before you fly"/);
    expect(SOURCE).not.toMatch(/Before today's flight/);
    expect(SOURCE).not.toMatch(/Check off what you.{1,3}ve reviewed/);
  });

  it("never renders a standalone 'Recommended study' reading-list section", () => {
    expect(SOURCE).not.toMatch(/title="Recommended study"/);
  });

  it("curated FAA study references remain available, attached as citations rather than their own section", () => {
    expect(SOURCE).toMatch(/referenceFor\(item\)/);
    expect(SOURCE).toMatch(/Based on \{ref\.topic\}/);
    expect(SOURCE).toMatch(/StudyResourceLink url=\{ref\.url\} label="View source"/);
  });
});
