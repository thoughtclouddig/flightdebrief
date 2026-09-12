import { describe, expect, it } from "vitest";
import { resolveMechanismCategory, resolveObservedMechanism } from "./observed-mechanism";
import type { AssessmentDifference } from "@/lib/types";

function difference(overrides: Partial<AssessmentDifference> = {}): AssessmentDifference {
  return {
    taskLabel: "Crosswind landings",
    studentLevel: "INDEPENDENT",
    instructorLevel: "NEEDS_COACHING",
    note: "You're still relaxing the correction once you get into the flare.",
    ...overrides,
  };
}

describe("resolveMechanismCategory — deterministic, from real capability facts only", () => {
  it("buckets a skill with an authored Chair Fly scenario as sequencing/rehearsal", () => {
    expect(resolveMechanismCategory("CROSSWIND_LANDING")).toBe("SEQUENCING_REHEARSAL");
  });

  it("buckets a skill with a real Radio Practice scenario as communication performance", () => {
    expect(resolveMechanismCategory("RADIO_COMMUNICATIONS")).toBe("COMMUNICATION_PERFORMANCE");
  });

  it("buckets a skill with only curated Q&A content as understanding/knowledge", () => {
    expect(resolveMechanismCategory("STEEP_TURNS")).toBe("UNDERSTANDING_KNOWLEDGE");
  });

  it("buckets a skill with no ground capability at all as flight-execution/transfer", () => {
    expect(resolveMechanismCategory("PREFLIGHT_INSPECTION")).toBe("FLIGHT_EXECUTION_TRANSFER");
  });

  it("never assigns RECOGNITION -- no deterministic source exists for it in V1", () => {
    const allSkills: string[] = ["CROSSWIND_LANDING", "RADIO_COMMUNICATIONS", "STEEP_TURNS", "PREFLIGHT_INSPECTION", "TOWER_READBACKS", "EMERGENCY_PROCEDURES"];
    for (const skill of allSkills) {
      expect(resolveMechanismCategory(skill as never)).not.toBe("RECOGNITION");
    }
  });
});

describe("resolveObservedMechanism — the quote is the fact, never inferred from free text", () => {
  it("preserves the exact instructor quote when this unit's skill is the last debrief's own contested objective", () => {
    const mechanism = resolveObservedMechanism([difference()], "CROSSWIND_LANDING");
    expect(mechanism).toEqual({
      quote: "You're still relaxing the correction once you get into the flare.",
      source: "instructor",
      category: "SEQUENCING_REHEARSAL",
    });
  });

  it("returns null when the contested objective belongs to a different skill than this unit", () => {
    const mechanism = resolveObservedMechanism([difference({ taskLabel: "Steep turns" })], "CROSSWIND_LANDING");
    expect(mechanism).toBeNull();
  });

  it("returns null, honestly, for a freeform debrief -- assessmentDifferences is always [] there, never guessed from the description text", () => {
    const mechanism = resolveObservedMechanism([], "CROSSWIND_LANDING");
    expect(mechanism).toBeNull();
  });

  it("returns null when the contested note is empty -- no mechanism was actually written down", () => {
    const mechanism = resolveObservedMechanism([difference({ note: "" })], "CROSSWIND_LANDING");
    expect(mechanism).toBeNull();
  });

  it("never fabricates a mechanism for a skill with no matching contested objective at all", () => {
    const mechanism = resolveObservedMechanism([difference({ taskLabel: "Something else entirely" })], "STEEP_TURNS");
    expect(mechanism).toBeNull();
  });
});
