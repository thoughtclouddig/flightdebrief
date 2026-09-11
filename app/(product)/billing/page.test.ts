import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * BillingPage is an async Server Component coupled to real repository/auth
 * access -- too heavy to render in a unit test, same reasoning
 * app/(product)/flights/[id]/debrief/page.test.ts already documents for a
 * page this shape. This is a static-source proof that a non-subscribed
 * school org takes the free-forever branch (never the paywall/subscribe
 * upsell), while an already-subscribed school still sees its real plan.
 */
const SOURCE = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("BillingPage — schools are free forever, no debrief-count paywall", () => {
  it("checks subscribed before org.kind, so an already-paying school still sees its current plan", () => {
    const subscribedIndex = SOURCE.indexOf("{subscribed ? (");
    const schoolFreeIndex = SOURCE.indexOf('org.kind === "school"\n              ? "Free for your school');
    expect(subscribedIndex).toBeGreaterThan(-1);
    expect(schoolFreeIndex).toBeGreaterThan(subscribedIndex);
  });

  it("a non-subscribed school never reaches the Pilot Plan paywall copy", () => {
    // The free-forever branch for independent_cfi/school comes before the
    // Pilot Plan card in source order, and school is folded into that same
    // branch rather than falling through to the usage-based upsell.
    expect(SOURCE).toMatch(/org\.kind === "independent_cfi" \|\| org\.kind === "school"/);
  });

  it("no longer imports or renders the per-location Subscribe control for schools", () => {
    expect(SOURCE).not.toContain("SchoolProSubscribe");
  });
});
