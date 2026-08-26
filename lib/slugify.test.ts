import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Stabilized Approaches 101")).toBe("stabilized-approaches-101");
  });

  it("strips punctuation and apostrophes without leaving stray hyphens", () => {
    expect(slugify("What's a Go-Around, Really?")).toBe("whats-a-go-around-really");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  -- Ready to Fly --  ")).toBe("ready-to-fly");
  });
});
