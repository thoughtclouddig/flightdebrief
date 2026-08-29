import { describe, expect, it } from "vitest";
import { __testing } from "./research";

const { toSourceType } = __testing;

describe("toSourceType", () => {
  it("accepts the exact vocabulary", () => {
    expect(toSourceType("faa_guidance")).toBe("faa_guidance");
    expect(toSourceType("peer_reviewed_research")).toBe("peer_reviewed_research");
  });

  it("recognises how the researcher actually describes sources", () => {
    // All three are real labels returned by the research pass.
    expect(toSourceType("peer-reviewed journal")).toBe("peer_reviewed_research");
    expect(toSourceType("14 CFR / FAA regulatory standard (ACS)")).toBe("faa_requirement");
    expect(toSourceType("advisory/industry safety publication (non-regulatory)")).toBe("industry_standard");
  });

  it("keeps binding and non-binding apart", () => {
    expect(toSourceType("FAA Advisory Circular")).toBe("faa_guidance");
    expect(toSourceType("Aviation Instructor's Handbook")).toBe("faa_guidance");
    expect(toSourceType("14 CFR Part 61 requirement")).toBe("faa_requirement");
  });

  it("under-claims anything it doesn't recognise", () => {
    expect(toSourceType("other (journalism reporting on in-progress research)")).toBe("expert_opinion");
    expect(toSourceType("")).toBe("expert_opinion");
  });
});
