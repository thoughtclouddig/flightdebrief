import { describe, expect, it } from "vitest";
import { firstName, renderEmail } from "./email-layout";

describe("firstName", () => {
  it("takes only the first word of a full name", () => {
    expect(firstName("Bob Eagle")).toBe("Bob");
    expect(firstName("Danny Franks")).toBe("Danny");
  });

  it("passes through a single name", () => {
    expect(firstName("Andy")).toBe("Andy");
  });

  it("handles extra whitespace and multi-part names", () => {
    expect(firstName("  Priya   Anand ")).toBe("Priya");
    expect(firstName("Jean Luc Picard")).toBe("Jean");
  });

  it("falls back rather than greeting an empty string", () => {
    expect(firstName("")).toBe("there");
    expect(firstName("   ")).toBe("there");
  });
});

describe("renderEmail", () => {
  const base = { preheader: "p", heading: "H", body: ["b"] };

  it("always includes the raw URL as a button fallback", () => {
    const html = renderEmail({ ...base, cta: { label: "Go", url: "https://example.com/x" } });
    expect(html.match(/https:\/\/example\.com\/x/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("carries the preheader for the inbox snippet", () => {
    expect(renderEmail({ ...base, preheader: "Good for 15 minutes." })).toContain("Good for 15 minutes.");
  });
});
