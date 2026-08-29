import { describe, expect, it } from "vitest";
import { buildDebriefNarration } from "./debrief-narration";

const BASE_INPUT = {
  studentFirstName: "Mia",
  whatWeDid: ["steep turns", "slow flight"],
  wentWell: ["your aircraft control was noticeably smoother"],
  needsWork: ["pattern consistency"],
  instructorGuidance: [],
  actionItems: ["getting stabilized earlier on final"],
  studyReferences: [{ topic: "Stabilized Approaches", source: "FAA Airplane Flying Handbook", url: "", why: "" }],
};

describe("buildDebriefNarration", () => {
  it("attributes instructional content to the CFI by first name when known", () => {
    const script = buildDebriefNarration({ ...BASE_INPUT, instructorFirstName: "Jake" });
    expect(script).toContain("Jake noted that");
    expect(script).toContain("you and Jake identified");
    expect(script).toContain("Jake wants you to focus on");
    expect(script).toContain("Overall, Jake felt this was a good flight");
    expect(script).not.toMatch(/\bnull\b/i);
  });

  it('falls back to "your instructor" when no instructor is assigned, never blank', () => {
    const script = buildDebriefNarration({ ...BASE_INPUT, instructorFirstName: null });
    expect(script).toContain("Your instructor noted that");
    expect(script).toContain("you and your instructor identified");
    expect(script).toContain("your instructor wants you to focus on");
    expect(script).not.toContain("undefined");
    expect(script).not.toContain("null");
  });

  it("never claims AfterFlight independently recommended a study resource", () => {
    const script = buildDebriefNarration({ ...BASE_INPUT, instructorFirstName: "Jake" });
    expect(script).toContain("based on what you and Jake discussed");
  });
});

describe("spoken instructor guidance is capped", () => {
  const base = {
    studentFirstName: "Danny",
    instructorFirstName: "Maria",
    whatWeDid: ["Landings"],
    wentWell: ["you held the centerline"],
    needsWork: ["flare timing"],
    actionItems: ["approach speed"],
    studyReferences: [],
  };

  it("reads at most four quotes aloud, in order", () => {
    const script = buildDebriefNarration({
      ...base,
      instructorGuidance: Array.from({ length: 14 }, (_, i) => ({
        instructorName: "Maria",
        quote: `quote number ${i + 1}`,
      })),
    });
    expect(script).toContain("quote number 1");
    expect(script).toContain("quote number 4");
    expect(script).not.toContain("quote number 5");
    expect(script).not.toContain("quote number 14");
  });

  it("leaves a short list untouched", () => {
    const script = buildDebriefNarration({
      ...base,
      instructorGuidance: [{ instructorName: "Maria", quote: "only quote" }],
    });
    expect(script).toContain("only quote");
  });
});

describe("person conversion covers every spoken field", () => {
  const base = {
    studentFirstName: "Danny",
    instructorFirstName: "Nina",
    whatWeDid: [],
    wentWell: [],
    needsWork: [],
    instructorGuidance: [],
    actionItems: [],
    studyReferences: [],
  };

  it("converts the single needsWork item, which is interpolated rather than listed", () => {
    const script = buildDebriefNarration({
      ...base,
      needsWork: ["Nina had me work on getting configured earlier on downwind, so I'm not rushed on base"],
    });
    expect(script).toContain("Nina had you work on getting configured earlier on downwind, so you're not rushed on base");
    expect(script).not.toContain("had me work");
  });

  it("converts the narrative recap, which returns before the template runs", () => {
    const script = buildDebriefNarration({
      ...base,
      narrativeRecap: "Nina had me work on configuring earlier, so I'm not rushed.",
    });
    expect(script).toContain("Nina had you work on configuring earlier, so you're not rushed.");
    expect(script).not.toContain("had me");
  });

  it("converts the first action item", () => {
    const script = buildDebriefNarration({ ...base, actionItems: ["practice my radio calls"] });
    expect(script).toContain("practice your radio calls");
  });
});
