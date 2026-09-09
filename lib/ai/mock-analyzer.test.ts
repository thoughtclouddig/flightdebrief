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
