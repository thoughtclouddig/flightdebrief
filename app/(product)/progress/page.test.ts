import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * ProgressPage is an async Server Component coupled to real repository/
 * viewer access -- too heavy to render in a unit test, matching this
 * repo's established pattern for this shape of file. Static-source proof
 * that the legacy "Action items" section (a verbatim V1 carryover that
 * duplicated Next Flight's "Before you fly" checklist and pushed Skills/
 * ACS below the fold) stays removed, and that Skills/ACS/Themes -- the
 * actual approved V2 Progress contract -- remain present.
 */
const SOURCE = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("Progress page — legacy Action Items stays removed", () => {
  it("never renders an 'Action items' section", () => {
    expect(SOURCE).not.toMatch(/Section title="Action items"/);
  });

  it("no longer fetches training items for an action-items block", () => {
    expect(SOURCE).not.toMatch(/listTrainingItems\(\)/);
    expect(SOURCE).not.toMatch(/TrainingItemChecklist/);
  });
});

describe("Progress page — Skills, ACS, and Themes remain intact", () => {
  it("still builds Skills/ACS via the shared production adapter", () => {
    expect(SOURCE).toMatch(/buildProductionProgressProps/);
    expect(SOURCE).toMatch(/skills={skills}/);
    expect(SOURCE).toMatch(/acs={acs}/);
  });

  it("still renders the Themes section with recurring-theme evidence", () => {
    expect(SOURCE).toMatch(/Section title="Themes"/);
    expect(SOURCE).toMatch(/brief\.recurringThemes/);
  });
});
