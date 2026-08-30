import { describe, it, expect } from "vitest";
import { formatHeadline, preventOrphan, toTitleCase } from "./headline";

describe("toTitleCase", () => {
  it("capitalises the significant words", () => {
    expect(toTitleCase("how to tell if a student is switching instructors")).toBe(
      "How to Tell if a Student Is Switching Instructors",
    );
  });

  it("keeps minor words lowercase in the middle", () => {
    expect(toTitleCase("the cost of a go-around")).toBe("The Cost of a Go-Around");
  });

  it("capitalises a minor word at either end", () => {
    expect(toTitleCase("of mice and men")).toBe("Of Mice and Men");
    expect(toTitleCase("what students give up")).toBe("What Students Give Up");
  });

  it("leaves acronyms and type designations alone", () => {
    // Lowercasing these would destroy them; capitalising the first letter
    // would be the only change and is not what they need.
    expect(toTitleCase("what the FAA says about IFR currency")).toBe("What the FAA Says About IFR Currency");
    expect(toTitleCase("flying the PA-28 in a crosswind")).toBe("Flying the PA-28 in a Crosswind");
    expect(toTitleCase("understanding FlightScore")).toBe("Understanding FlightScore");
  });

  it("capitalises after a hyphen", () => {
    expect(toTitleCase("the go-around you didn't make")).toBe("The Go-Around You Didn't Make");
  });
});

describe("preventOrphan", () => {
  it("binds the last two words so the final line can't be one word", () => {
    const out = preventOrphan("How to Tell If a Student Is Switching Instructors Because of You");
    expect(out).toContain("of\u00A0You");
    expect(out.endsWith("of\u00A0You")).toBe(true);
  });

  it("leaves a long final pair alone rather than forcing an overflow", () => {
    // Binding these would push a 27-character unbreakable run onto one line.
    const out = preventOrphan("Understanding Transitioning Instructors");
    expect(out).not.toContain("\u00A0");
  });

  it("does nothing to a two-word headline", () => {
    expect(preventOrphan("Crosswind Landings")).toBe("Crosswind Landings");
  });
});

describe("formatHeadline", () => {
  it("applies both rules", () => {
    const out = formatHeadline("how to tell if a student is switching instructors because of you");
    expect(out.startsWith("How to Tell if a Student")).toBe(true);
    expect(out.endsWith("of\u00A0You")).toBe(true);
  });
});
