import { computeSchoolFreeDebriefs, computeStudentFreeFlights } from "@/lib/entitlements";
import type { Repository } from "@/lib/data/types";
import type { Organization } from "@/lib/types";

/** Stripe subscription statuses that should unlock paid features. Deliberately excludes past_due/unpaid/incomplete -- a failed payment should re-trigger the paywall, not silently keep access. */
const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export function hasActiveSubscription(org: Organization): boolean {
  return org.subscriptionStatus != null && ACTIVE_STATUSES.has(org.subscriptionStatus);
}

/**
 * True once an org has used up its free tier (3 flights for a solo pilot,
 * 25 debriefs for a school) with no active Stripe subscription to cover
 * further usage -- the signal to show a paywall instead of analyzing another
 * debrief. Independent CFI orgs are free forever and never gated.
 */
export async function isBillingBlocked(repo: Repository, org: Organization): Promise<boolean> {
  // Live-demo orgs (lib/demo/live-demo-seed.ts) must never hit the paywall --
  // they're expired and deleted lazily, not meant to convert to real usage.
  if (org.demoExpiresAt != null) return false;
  if (org.kind === "independent_cfi") return false;
  if (hasActiveSubscription(org)) return false;

  const flights = await repo.listFlights({ organizationId: org.id });
  const usage = org.kind === "school" ? computeSchoolFreeDebriefs(flights) : computeStudentFreeFlights(flights);
  return usage.exhausted;
}
