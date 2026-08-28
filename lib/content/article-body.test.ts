import { describe, expect, it } from "vitest";
import { hasStructuredBody, toPlainText, type ArticleBody } from "./article-body";

const full: ArticleBody = {
  answer: "A good debrief takes about ten minutes.",
  keyFacts: ["Ten minutes is enough", "One priority beats five"],
  sections: [{ heading: "Why does it matter?", body: "The specifics fade first." }],
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

  it("leads with the answer", () => {
    expect(toPlainText(full).startsWith("A good debrief")).toBe(true);
  });

  it("drops empty parts instead of leaving blank runs", () => {
    const text = toPlainText({ ...full, keyFacts: [], faq: [] });
    expect(text).not.toMatch(/\n{3,}/);
  });
});
