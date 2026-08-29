import { describe, it, expect } from "vitest";
import { blocksPublish } from "./publish-guard";

const source = { label: "FAA Airplane Flying Handbook", url: "https://faa.gov/x", sourceType: "faa_guidance" as const };

describe("blocksPublish", () => {
  it("allows an article that carries sources", () => {
    expect(blocksPublish([source])).toBeNull();
  });

  it("blocks an article with none", () => {
    expect(blocksPublish([])).toContain("no sources");
  });

  it("blocks when sources are missing entirely rather than assuming the best", () => {
    // A caller that forgot to load them must not accidentally publish.
    expect(blocksPublish(undefined)).toContain("no sources");
    expect(blocksPublish(null)).toContain("no sources");
  });
});
