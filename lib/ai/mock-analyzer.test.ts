import { describe, expect, it } from "vitest";
import { analyzeMock } from "./mock-analyzer";
import type { AnalyzeDebriefInput } from "./schema";

function input(transcript: string): AnalyzeDebriefInput {
  return {
    transcript,
    flightMeta: {
      tailNumber: "N12345",
      aircraftType: "Cessna 172",
      departureAirport: "KFFZ",
      arrivalAirport: "KFFZ",
      flightDate: "2026-01-01",
      durationMinutes: 60,
      instructorName: "Sarah",
      hasInstructor: true,
    },
    previousActionItems: [],
  };
}

describe("analyzeMock nextFlightCue", () => {
  it("produces a short, non-empty cue when a weakness is discussed", () => {
    const result = analyzeMock(
      input("My landings were rough today -- carrying too much speed on final and floating almost every time."),
    );

    expect(result.nextFlightCue.length).toBeGreaterThan(0);
    expect(result.nextFlightCue.split(/\s+/).length).toBeLessThan(10);
  });

  it("returns an empty cue when nothing needs work", () => {
    const result = analyzeMock(input("Great flight, everything felt solid today."));
    expect(result.nextFlightCue).toBe("");
  });

  it("picks a crosswind-specific cue when that's the discussed weakness", () => {
    const result = analyzeMock(input("The airplane felt squirrelly on the crosswind landing today."));
    expect(result.nextFlightCue.toLowerCase()).toContain("wind");
  });
});

describe("analyzeMock — solo flight", () => {
  it("never populates instructorGuidance/instructorAssistance when hasInstructor is false, even if the transcript mentions an instructor from a past flight", () => {
    const base = input(
      "My landings were rough today, carrying too much speed. My instructor used to tell me to trim for the speed, and that stuck with me.",
    );
    const solo: typeof base = { ...base, flightMeta: { ...base.flightMeta, hasInstructor: false, instructorName: null } };
    const result = analyzeMock(solo);
    expect(result.instructorGuidance).toEqual([]);
    expect(result.instructorAssistance).toEqual([]);
  });
});

describe("analyzeMock actionItems — validate before transform, never echo raw narration", () => {
  it("a narrative recap never becomes an action item, even when it happens to contain a keyword toActionItem would otherwise match", () => {
    // "Danny had me work on" matches the narrative-recap shape (a name +
    // "had me...") -- the same shape "Danny walked me through an engine-out
    // simulation..." shipped with. It also contains "radio", which
    // toActionItem's keyword table would otherwise turn into a real-sounding
    // instruction. Validating needsWork BEFORE the keyword match runs is
    // what stops that: this sentence must never reach toActionItem at all.
    const result = analyzeMock(input("Danny had me work on the radio during the emergency scenario."));
    expect(result.actionItems).toEqual([]);
    // The evidence itself is preserved (still visible as something the
    // debrief said), it just isn't turned into manufactured homework.
    expect(result.needsWork.some((s) => s.includes("Danny had me work on the radio"))).toBe(true);
  });

  it("an unmatched, non-narrative needs-work sentence produces no fabricated action item either -- never a raw 'Work on: ...' echo", () => {
    const result = analyzeMock(input("I need to work on my overall confidence in the pattern today."));
    expect(result.actionItems.some((s) => s.startsWith("Work on:"))).toBe(false);
  });

  it("a genuinely actionable, non-narrative needs-work sentence still produces its real keyword-mapped action item", () => {
    const result = analyzeMock(input("I need to work on radio calls in the pattern today."));
    expect(result.actionItems).toContain("Practice tower readback scenarios, including amended instructions");
  });

  it("known keyword mappings (speed, crosswind) still produce their intended real action item", () => {
    const speed = analyzeMock(input("I was carrying too much speed on final and floated a couple of times."));
    expect(speed.actionItems).toContain("Review target approach speeds");

    const crosswind = analyzeMock(input("The airplane felt squirrelly on the crosswind landing today."));
    expect(crosswind.actionItems).toContain("Practice crosswind correction technique on final");
  });

  it("a vague restatement with no nameable skill produces no action item, narrative or otherwise", () => {
    const result = analyzeMock(input("I need to keep working on that today."));
    expect(result.actionItems).toEqual([]);
  });
});
