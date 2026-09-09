import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * buildProductionProgressProps is an async function coupled to real
 * repository access and computeNextLessonBrief's own DB-coupled dependency
 * graph -- too heavy to exercise directly in a unit test
 * (instructorAttributionLabel() itself has its own full coverage in
 * lib/instructor-attribution.test.ts). Static source proof that a genuinely
 * solo last flight (brief.lastInstructor === null) can never reach the
 * unconditional "{instructorFirstName} has rated it" / "is
 * {instructorFirstName}'s call" copy that shipped here before this fix.
 */
const SOURCE = readFileSync(new URL("./progress-production-adapter.tsx", import.meta.url), "utf8");

describe("Progress readiness tip — never implies an instructor when brief.lastInstructor is null", () => {
  it("resolves attribution via instructorAttributionLabel, not resolveCfiFirstName's ambiguous null alone", () => {
    expect(SOURCE).toMatch(/instructorAttributionLabel\(brief\.lastInstructor\)/);
    expect(SOURCE).not.toMatch(/resolveCfiFirstName/);
  });

  it("the 'assessed' sentence is conditional on cfi, not an unconditional fallback string", () => {
    expect(SOURCE).toMatch(/\{cfi \? `\$\{cfi\} has` : "you've"\}/);
  });

  it("the checkride sign-off sentence is conditional on cfi", () => {
    expect(SOURCE).toMatch(/\{cfi \? `Signing you off for a checkride is \$\{cfi\}'s call\.` : "Checkride sign-off isn't decided here\."\}/);
  });
});
