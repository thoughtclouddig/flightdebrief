import { describe, expect, it } from "vitest";
import { hasStructuredBody, toPlainText, type ArticleBody } from "./article-body";

const full: ArticleBody = {
  answer: "A good debrief takes about ten minutes.",
  keyFacts: ["Ten minutes is enough", "One priority beats five"],
  sections: [
    {
      heading: "Why does it matter?",
      body: "The specifics fade first.",
      steps: ["Open the recording", "Name one priority"],
      tip: "Do it on the ramp, not at home.",
      subsections: [{ heading: "What fades first", body: "Sequencing, not stick and rudder." }],
    },
  ],
  faq: [{ question: "How long?", answer: "Ten to fifteen minutes." }],
};

describe("hasStructuredBody", () => {
  it("accepts a body with an answer and at least one section", () => {
    expect(hasStructuredBody(full)).toBe(true);
  });

  it("rejects null -- articles written before the structure existed", () => {
    expect(hasStructuredBody(null)).toBe(false);
  });

  it("rejects a body with no sections, so it falls back to prose rather than rendering a stub", () => {
    expect(hasStructuredBody({ ...full, sections: [] })).toBe(false);
  });

  it("rejects a blank answer -- the lead is the one part that can't be empty", () => {
    expect(hasStructuredBody({ ...full, answer: "   " })).toBe(false);
  });
});

describe("toPlainText", () => {
  it("includes every part, so excerpts and search see the whole article", () => {
    const text = toPlainText(full);
    expect(text).toContain("A good debrief takes about ten minutes.");
    expect(text).toContain("One priority beats five");
    expect(text).toContain("Why does it matter?");
    expect(text).toContain("The specifics fade first.");
    expect(text).toContain("Ten to fifteen minutes.");
  });

  it("includes steps, the tip, and subsections, so excerpts and search see them too", () => {
    const text = toPlainText(full);
    expect(text).toContain("1. Open the recording");
    expect(text).toContain("2. Name one priority");
    expect(text).toContain("Do it on the ramp, not at home.");
    expect(text).toContain("What fades first");
    expect(text).toContain("Sequencing, not stick and rudder.");
  });

  it("handles a section written before steps/tip/subsections existed", () => {
    const legacy: ArticleBody = { ...full, sections: [{ heading: "Old", body: "Prose only." }] };
    expect(() => toPlainText(legacy)).not.toThrow();
    expect(toPlainText(legacy)).toContain("Prose only.");
  });

  it("leads with the answer", () => {
    expect(toPlainText(full).startsWith("A good debrief")).toBe(true);
  });

  it("drops empty parts instead of leaving blank runs", () => {
    const text = toPlainText({ ...full, keyFacts: [], faq: [] });
    expect(text).not.toMatch(/\n{3,}/);
  });
});
