import { afterEach, describe, expect, it, vi } from "vitest";
import { isContentPublic } from "./visibility";

afterEach(() => vi.unstubAllEnvs());

describe("isContentPublic", () => {
  it("is off when the flag is unset -- the surface must fail closed", () => {
    expect(isContentPublic()).toBe(false);
  });

  it("is off for anything that isn't an explicit opt-in", () => {
    for (const value of ["", " ", "0", "false", "no", "maybe", "public"]) {
      vi.stubEnv("CONTENT_PUBLIC", value);
      expect(isContentPublic()).toBe(false);
    }
  });

  it("opens only on an explicit truthy value", () => {
    for (const value of ["1", "true", "TRUE", "yes", " yes "]) {
      vi.stubEnv("CONTENT_PUBLIC", value);
      expect(isContentPublic()).toBe(true);
    }
  });
});
