import { describe, expect, it } from "vitest";
import { resolveCfiFirstName } from "./instructor-attribution";

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
