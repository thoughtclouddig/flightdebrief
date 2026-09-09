import { describe, expect, it } from "vitest";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompt";
import type { AnalyzeDebriefInput } from "./schema";

function baseInput(overrides: Partial<AnalyzeDebriefInput["flightMeta"]>): AnalyzeDebriefInput {
  return {
    transcript: "We worked the pattern today.",
    flightMeta: {
      tailNumber: "N728DE",
      aircraftType: "DA40",
      departureAirport: "KFFZ",
      arrivalAirport: "KFFZ",
      flightDate: "2026-09-09",
      durationMinutes: 60,
      instructorName: null,
      hasInstructor: false,
      ...overrides,
    },
    previousActionItems: [],
  };
}

describe("SYSTEM_PROMPT — explicit solo-flight rule", () => {
  it("tells the model solo flights exist and forbids inventing a second person", () => {
    expect(SYSTEM_PROMPT).toMatch(/SOLO/);
    expect(SYSTEM_PROMPT).toMatch(/narrativeRecap/);
    const lower = SYSTEM_PROMPT.toLowerCase();
    expect(lower).toContain("your instructor");
    expect(lower).toContain("your cfi");
    expect(lower).toContain("you both");
  });

  it("requires instructorGuidance/instructorAssistance to be empty for a solo flight", () => {
    const soloRule = SYSTEM_PROMPT.split("\n").find((line) => line.includes("SOLO"));
    expect(soloRule).toBeDefined();
    expect(soloRule).toContain("instructorGuidance");
    expect(soloRule).toContain("instructorAssistance");
    expect(soloRule).toMatch(/empty/i);
  });
});

describe("buildUserPrompt — participant context is explicit, not inferred", () => {
  it("tells the model plainly this was a SOLO flight when hasInstructor is false", () => {
    const prompt = buildUserPrompt(baseInput({ hasInstructor: false, instructorName: null }));
    expect(prompt).toMatch(/This was a SOLO flight/);
    expect(prompt).not.toMatch(/\(not specified\)/);
  });

  it('never renders the old ambiguous "(not specified)" framing for a solo flight, even if instructorName is somehow non-null', () => {
    // hasInstructor is the explicit signal now -- instructorName's presence
    // must never override it. This is the exact ambiguity that let the
    // model interpret "(not specified)" as "instructor present but
    // unnamed" instead of "no instructor at all."
    const prompt = buildUserPrompt(baseInput({ hasInstructor: false, instructorName: "" }));
    expect(prompt).toMatch(/This was a SOLO flight/);
  });

  it("names the instructor when hasInstructor is true and a name is known", () => {
    const prompt = buildUserPrompt(baseInput({ hasInstructor: true, instructorName: "Jake" }));
    expect(prompt).toMatch(/Instructor on this flight: Jake/);
    expect(prompt).not.toMatch(/SOLO flight/);
  });

  it("is honest that an instructor exists but is unnamed, rather than claiming solo", () => {
    const prompt = buildUserPrompt(baseInput({ hasInstructor: true, instructorName: null }));
    expect(prompt).toMatch(/Instructor on this flight: present, but not named/);
    expect(prompt).not.toMatch(/SOLO flight/);
  });
});
