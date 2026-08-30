import { describe, it, expect } from "vitest";
import { isPeopleSubject } from "./art-direction";

describe("isPeopleSubject", () => {
  it("routes articles about instructors and students away from aircraft shots", () => {
    // The article that produced a Cessna in flight with a poem attached.
    expect(isPeopleSubject("How to Tell If a Student Is Switching Instructors Because of You")).toBe(true);
    expect(isPeopleSubject("What a flight school should pay a new CFI")).toBe(true);
    expect(isPeopleSubject("Why students quit before their checkride")).toBe(true);
  });

  it("leaves articles about flying an aeroplane in the flying pool", () => {
    expect(isPeopleSubject("How to fly a stabilised approach in gusty wind")).toBe(false);
    expect(isPeopleSubject("Reading a METAR before a cross-country")).toBe(false);
    expect(isPeopleSubject("Short-field takeoffs at high density altitude")).toBe(false);
  });

  it("matches whole words, so a chance substring does not reroute an article", () => {
    // "costs" matches; "coastal" must not.
    expect(isPeopleSubject("Coastal fog and the marine layer")).toBe(false);
  });
});
