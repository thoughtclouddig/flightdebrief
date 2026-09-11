import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * AdminOverviewPage is an async Server Component coupled to real
 * repository/auth access -- too heavy to render in a unit test, same
 * reasoning app/(product)/flights/[id]/debrief/page.test.ts already
 * documents for a page this shape. Static-source proof that the school
 * card no longer frames usage as a 25-debrief countdown.
 */
const SOURCE = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("AdminOverviewPage — school card no longer implies a debrief cap", () => {
  it("doesn't compute or render a free-debriefs countdown for schools anymore", () => {
    expect(SOURCE).not.toContain("computeSchoolFreeDebriefs");
    expect(SOURCE).not.toMatch(/of\s*\{freeDebriefs\.cap\}/);
  });

  it("tells a school admin plainly that it's free, no limit", () => {
    expect(SOURCE).toContain("Free for your school");
  });
});
