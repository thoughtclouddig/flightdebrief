import { afterEach, describe, expect, it, vi } from "vitest";
import { planForStripePriceId } from "./stripe";

const ENV = {
  STRIPE_PRICE_PILOT_MONTHLY: "price_pilot_m",
  STRIPE_PRICE_PILOT_ANNUAL: "price_pilot_a",
  STRIPE_PRICE_SCHOOL_MONTHLY: "price_school_m",
  STRIPE_PRICE_SCHOOL_ANNUAL: "price_school_a",
};

afterEach(() => vi.unstubAllEnvs());
function withPrices() {
  for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
}

describe("planForStripePriceId", () => {
  it("maps both billing periods of a plan to that plan", () => {
    withPrices();
    expect(planForStripePriceId("price_pilot_m")).toBe("pilot");
    expect(planForStripePriceId("price_pilot_a")).toBe("pilot");
    expect(planForStripePriceId("price_school_m")).toBe("school_pro");
    expect(planForStripePriceId("price_school_a")).toBe("school_pro");
  });

  it("returns null for an unknown price so the stored plan is left alone", () => {
    withPrices();
    expect(planForStripePriceId("price_retired_2024")).toBeNull();
  });

  it("never matches an unset env var against an empty price id", () => {
    // No stubs: every configured value is undefined. A naive equality check
    // would match undefined === undefined and mislabel the plan.
    expect(planForStripePriceId("")).toBeNull();
    expect(planForStripePriceId("price_anything")).toBeNull();
  });
});
