import { describe, expect, it } from "vitest";
import { instructorAttributionLabel, resolveCfiFirstName } from "./instructor-attribution";

describe("resolveCfiFirstName", () => {
  it("returns the first token of a full name", () => {
    expect(resolveCfiFirstName({ id: "i1", name: "Danny Franks" })).toBe("Danny");
  });

  it("returns the name as-is when it's already a bare first name", () => {
    expect(resolveCfiFirstName({ id: "i1", name: "Jake" })).toBe("Jake");
  });

  it("returns null for an empty or whitespace-only name", () => {
    expect(resolveCfiFirstName({ id: "i1", name: "   " })).toBeNull();
  });

  it("returns null when there's no instructor", () => {
    expect(resolveCfiFirstName(null)).toBeNull();
  });
});

describe("instructorAttributionLabel", () => {
  it("returns null for a genuinely solo flight -- callers must never mention an instructor", () => {
    expect(instructorAttributionLabel(null)).toBeNull();
  });

  it("returns the resolved first name when an instructor exists and is named", () => {
    expect(instructorAttributionLabel({ id: "i1", name: "Danny Franks" })).toBe("Danny");
  });

  it("falls back to the generic label when an instructor exists but the name is unresolvable -- distinct from the null/solo case", () => {
    expect(instructorAttributionLabel({ id: "i1", name: "   " })).toBe("your instructor");
  });
});
