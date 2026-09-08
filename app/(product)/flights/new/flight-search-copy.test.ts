import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Both flight-search clients are "use client" components driven by state and
 * fetch(), too interaction-coupled for a render test to reach the
 * zero-candidates branch -- static source proof instead, matching this
 * codebase's existing precedent for that situation.
 */
const STUDENT_SOURCE = readFileSync(new URL("./student-new-flight-client.tsx", import.meta.url), "utf8");
const CFI_SOURCE = readFileSync(new URL("./new-flight-client.tsx", import.meta.url), "utf8");

describe("Flight search zero-result copy -- no unproven aircraft opt-out claim", () => {
  it.each([
    ["student", STUDENT_SOURCE],
    ["CFI/admin", CFI_SOURCE],
  ])("%s search flow doesn't assert ADS-B opt-out for a plain zero-result response", (_label, source) => {
    const zeroResultParagraph = source.match(/No recent flights found[\s\S]{0,200}/)?.[0];
    expect(zeroResultParagraph).toBeDefined();
    expect(zeroResultParagraph).not.toMatch(/opt out/i);
    expect(zeroResultParagraph).not.toMatch(/ADS-B/i);
  });
});
