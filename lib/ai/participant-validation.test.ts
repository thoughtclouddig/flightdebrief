import { describe, expect, it } from "vitest";
import { stripUnsupportedParticipantReferences } from "./participant-validation";
import type { StructuredDebriefResult } from "./schema";

const BASE: StructuredDebriefResult = {
  flightSummary: "KFFZ pattern work.",
  narrativeRecap: "",
  whatWeDid: ["Pattern work"],
  wentWell: [],
  needsWork: [],
  instructorGuidance: [],
  instructorAssistance: [],
  riskManagementNotes: [],
  actionItems: [],
  nextLessonFocus: [],
  nextFlightCue: "",
  nextFlightCueContext: "",
  studyReferences: [],
  assessmentDifferences: [],
};

describe("stripUnsupportedParticipantReferences — instructor flight", () => {
  it("returns the result unchanged when hasInstructor is true", () => {
    const structured: StructuredDebriefResult = {
      ...BASE,
      narrativeRecap: "You and your instructor identified a few things to work on.",
      instructorGuidance: [{ instructorName: "Jake", quote: "Hold that speed" }],
    };
    expect(stripUnsupportedParticipantReferences(structured, true)).toEqual(structured);
  });
});

describe("stripUnsupportedParticipantReferences — solo flight, the real Staging defect", () => {
  it('drops narrativeRecap containing "you and your instructor" -- the exact reported phrase', () => {
    const structured: StructuredDebriefResult = {
      ...BASE,
      narrativeRecap: "Today you and your instructor identified a few things to work on for next time.",
    };
    const result = stripUnsupportedParticipantReferences(structured, false);
    expect(result.narrativeRecap).toBe("");
  });

  it('drops narrativeRecap containing "your instructor" alone', () => {
    const structured: StructuredDebriefResult = { ...BASE, narrativeRecap: "Your instructor noted good progress today." };
    expect(stripUnsupportedParticipantReferences(structured, false).narrativeRecap).toBe("");
  });

  it("leaves a genuinely solo-voiced narrativeRecap untouched", () => {
    const structured: StructuredDebriefResult = {
      ...BASE,
      narrativeRecap: "Today you worked on pattern work and your landings felt solid.",
    };
    const result = stripUnsupportedParticipantReferences(structured, false);
    expect(result.narrativeRecap).toBe(structured.narrativeRecap);
  });

  it("drops individual wentWell/needsWork/actionItems entries that claim participation, keeping the rest", () => {
    const structured: StructuredDebriefResult = {
      ...BASE,
      wentWell: ["Your radio calls were confident", "You and your instructor agreed the pattern work went well"],
      needsWork: ["Round-out timing on the flare", "Instructor noticed some drift on final"],
      actionItems: ["Practice short-field landings", "Your instructor wants tighter patterns"],
    };
    const result = stripUnsupportedParticipantReferences(structured, false);
    expect(result.wentWell).toEqual(["Your radio calls were confident"]);
    expect(result.needsWork).toEqual(["Round-out timing on the flare"]);
    expect(result.actionItems).toEqual(["Practice short-field landings"]);
  });

  it("always empties instructorGuidance -- structurally invalid on a solo flight regardless of content", () => {
    const structured: StructuredDebriefResult = {
      ...BASE,
      instructorGuidance: [{ instructorName: "Jake", quote: "Hold that speed a little longer" }],
    };
    expect(stripUnsupportedParticipantReferences(structured, false).instructorGuidance).toEqual([]);
  });

  it("drops instructorAssistance entries claiming participation", () => {
    const structured: StructuredDebriefResult = {
      ...BASE,
      instructorAssistance: ["Instructor took the controls during the go-around"],
    };
    expect(stripUnsupportedParticipantReferences(structured, false).instructorAssistance).toEqual([]);
  });

  it("drops nextFlightCue AND its context together when the cue claims participation, never leaving an orphaned label", () => {
    const structured: StructuredDebriefResult = {
      ...BASE,
      nextFlightCue: "Remember what your instructor said",
      nextFlightCueContext: "Landing flare",
    };
    const result = stripUnsupportedParticipantReferences(structured, false);
    expect(result.nextFlightCue).toBe("");
    expect(result.nextFlightCueContext).toBe("");
  });

  it("recognizes the full set of banned phrases from the product rule", () => {
    const phrases = [
      "your instructor said this went well",
      "your CFI was pleased",
      "you and your instructor covered a lot",
      "you both agreed on the plan",
      "you two worked through it",
      "you guys covered radio calls",
      "instructor noticed the drift",
      "instructor wants more practice",
      "you agreed the pattern was solid",
      "you disagreed about the approach",
    ];
    for (const phrase of phrases) {
      const structured: StructuredDebriefResult = { ...BASE, wentWell: [phrase] };
      expect(stripUnsupportedParticipantReferences(structured, false).wentWell).toEqual([]);
    }
  });

  it("does not rewrite text -- a violating entry is dropped entirely, never edited in place", () => {
    const structured: StructuredDebriefResult = { ...BASE, wentWell: ["You and your instructor nailed the crosswind landing"] };
    const result = stripUnsupportedParticipantReferences(structured, false);
    // Dropped outright, not rewritten into something like "You nailed the
    // crosswind landing" -- there's no way to safely guess whether that
    // edited claim is even still true, so the whole entry goes.
    expect(result.wentWell).toEqual([]);
  });
});
