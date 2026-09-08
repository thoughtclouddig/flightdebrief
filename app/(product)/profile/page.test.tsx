import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * ProfilePage is an async Server Component coupled to getViewer()/
 * getRepository() (real DB access) -- too heavy to render in a unit test.
 * Same static-source-scan approach components/school-v2/route-containment.test.tsx
 * already uses for exactly this situation: assert the real route strings
 * appear in source, and the seams this fix closes don't regress.
 */
const SOURCE = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("(product) Profile page — navigation seam fixes", () => {
  it("Support routes to the authenticated in-app screen, never a mailto: link", () => {
    expect(SOURCE).toMatch(/href="\/profile\/support"/);
    expect(SOURCE).not.toMatch(/mailto:/);
  });

  it("How AfterFlight works routes to the authenticated Guide screen, not the public marketing page", () => {
    expect(SOURCE).toMatch(/href="\/profile\/guide"/);
    expect(SOURCE).not.toMatch(/href="\/how-it-works"/);
  });

  it("Your audio & your data still uses the one authoritative /data-handling page, opened as an intentional new-tab transition", () => {
    expect(SOURCE).toMatch(/href="\/data-handling"/);
    expect(SOURCE).toMatch(/href="\/data-handling"\s*\n?\s*external/);
  });
});
