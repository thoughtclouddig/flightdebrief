import { describe, expect, it } from "vitest";
import { aimSectionUrl } from "./aim-links";

describe("aimSectionUrl", () => {
  it("derives the section page from a paragraph citation", () => {
    expect(aimSectionUrl("AIM 4-1-13, Automatic Terminal Information Service (ATIS)")).toBe(
      "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap4_section_1.html",
    );
  });

  it("uses the first citation when a source names two", () => {
    expect(aimSectionUrl("AIM 4-3-18, Taxiing; readback requirement per 4-4-10, Adherence to Clearance")).toBe(
      "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap4_section_3.html",
    );
  });

  it("returns null for a source that isn't an AIM paragraph, rather than guessing a URL", () => {
    expect(aimSectionUrl("Pilot/Controller Glossary, \"Traffic in Sight\"")).toBeNull();
    expect(aimSectionUrl("14 CFR 91.123")).toBeNull();
  });
});
