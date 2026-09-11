import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * ProgressPage is an async Server Component coupled to real repository/auth
 * access -- too heavy to render in a unit test, same reasoning
 * app/(product)/flights/[id]/debrief/page.test.ts already documents for a
 * page this shape. Static-source proof that Progress stays proficiency-only:
 * no Action Items, no account/billing usage line, and Themes is driven
 * solely by genuinely-recurring evidence, never a single-mention focus chip.
 */
const SOURCE = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("ProgressPage — proficiency only, no Action Items or account/billing content", () => {
  it("never renders an Action Items section", () => {
    expect(SOURCE).not.toContain("Action items");
    expect(SOURCE).not.toContain("Ongoing (");
    expect(SOURCE).not.toContain("Before your next flight (");
    expect(SOURCE).not.toContain("TrainingItemChecklist");
  });

  it("never renders free-flight/free-debrief usage copy", () => {
    expect(SOURCE).not.toContain("free flights");
    expect(SOURCE).not.toContain("free debriefs");
    expect(SOURCE).not.toContain("computeStudentFreeFlights");
    expect(SOURCE).not.toContain("computeSchoolFreeDebriefs");
    expect(SOURCE).not.toContain("hasActiveSubscription");
  });

  it("Themes is driven only by recurringThemes -- never renders the single-mention focusAreas chips", () => {
    expect(SOURCE).not.toContain("brief.focusAreas");
    expect(SOURCE).toContain("brief.recurringThemes");
  });

  it("keeps the honest empty state for when recurrence hasn't been established yet", () => {
    expect(SOURCE).toContain("Not enough debriefs yet to spot a recurring theme");
  });

  it("still passes through real Skills/ACS proficiency data", () => {
    expect(SOURCE).toContain("buildProductionProgressProps");
    expect(SOURCE).toContain("skills={skills}");
    expect(SOURCE).toContain("acs={acs}");
  });
});
