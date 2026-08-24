import { describe, expect, it } from "vitest";
import { isBillingBlocked } from "./billing-gate";
import type { Repository } from "@/lib/data/types";
import type { FlightWithRelations, Organization } from "@/lib/types";

function org(overrides: Partial<Organization>): Organization {
  return {
    id: "org-1",
    name: "Test Org",
    kind: "individual",
    defaultGuidanceMode: "freeform",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionStatus: null,
    subscriptionPlan: null,
    subscriptionQuantity: 1,
    demoExpiresAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function repoWithFlights(count: number): Repository {
  const flights = Array.from({ length: count }, () => ({ debriefStatus: "complete" }) as FlightWithRelations);
  return { listFlights: async () => flights } as unknown as Repository;
}

describe("isBillingBlocked", () => {
  it("blocks an individual org past the 3-flight free cap", async () => {
    const result = await isBillingBlocked(repoWithFlights(4), org({ kind: "individual" }));
    expect(result).toBe(true);
  });

  it("never blocks a demo org, even past the free cap", async () => {
    const demoOrg = org({ kind: "individual", demoExpiresAt: new Date(Date.now() + 60_000).toISOString() });
    const result = await isBillingBlocked(repoWithFlights(50), demoOrg);
    expect(result).toBe(false);
  });

  it("never blocks a demo school org past the 25-debrief cap", async () => {
    const demoOrg = org({ kind: "school", demoExpiresAt: new Date(Date.now() + 60_000).toISOString() });
    const result = await isBillingBlocked(repoWithFlights(50), demoOrg);
    expect(result).toBe(false);
  });
});
