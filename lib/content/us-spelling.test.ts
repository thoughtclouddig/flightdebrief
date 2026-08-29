import { describe, expect, it } from "vitest";
import { toUsSpelling, findBritishSpellings } from "./us-spelling";

describe("toUsSpelling", () => {
  it("fixes the aviation words that give it away", () => {
    expect(toUsSpelling("practise the manoeuvre")).toBe("practice the maneuver");
    expect(toUsSpelling("steep turns and other manoeuvres")).toBe("steep turns and other maneuvers");
    expect(toUsSpelling("the aeroplane is on the centre line")).toBe("the airplane is on the center line");
  });

  it("handles generated inflections, not just the listed base form", () => {
    expect(toUsSpelling("analysed the data")).toBe("analyzed the data");
    expect(toUsSpelling("organising a lesson")).toBe("organizing a lesson");
    expect(toUsSpelling("favoured by instructors")).toBe("favored by instructors");
  });

  it("preserves case", () => {
    expect(toUsSpelling("Manoeuvre")).toBe("Maneuver");
    expect(toUsSpelling("COLOUR")).toBe("COLOR");
    expect(toUsSpelling("colour")).toBe("color");
  });

  it("leaves American text untouched", () => {
    const american = "Practice the maneuver until the airplane tracks the center line.";
    expect(toUsSpelling(american)).toBe(american);
  });

  it("only matches whole words", () => {
    // "Centred" would be caught, but a word that merely contains one shouldn't.
    expect(toUsSpelling("greyhound")).toBe("greyhound");
  });
});

describe("findBritishSpellings", () => {
  it("reports what it found, for a sweep that shows its work", () => {
    expect(findBritishSpellings("The manoeuvre was analysed at the centre")).toEqual([
      "manoeuvre",
      "analysed",
      "centre",
    ]);
  });

  it("returns nothing for clean text", () => {
    expect(findBritishSpellings("The maneuver was analyzed at the center")).toEqual([]);
  });
});
