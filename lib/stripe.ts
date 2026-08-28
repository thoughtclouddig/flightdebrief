import Stripe from "stripe";
import { appOrigin } from "@/lib/email";
import type { BillingPlan } from "@/lib/types";

/**
 * Server-only Stripe client. Same convention as lib/ai/index.ts and
 * lib/email.ts: read the key directly from process.env at the point of use,
 * rather than a central config module.
 */
let cachedClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!cachedClient) {
    cachedClient = new Stripe(apiKey);
  }
  return cachedClient;
}

export type BillingPeriod = "monthly" | "annual";

/**
 * Maps (plan, billingPeriod) to a Stripe Price id. Every price is created
 * ahead of time in the Stripe dashboard (see lib/marketing/pricing.ts for the
 * matching public prices) -- nothing here creates prices dynamically.
 */
export function getStripePriceId(plan: BillingPlan, billingPeriod: BillingPeriod): string {
  const envVar =
    plan === "pilot"
      ? billingPeriod === "monthly"
        ? "STRIPE_PRICE_PILOT_MONTHLY"
        : "STRIPE_PRICE_PILOT_ANNUAL"
      : billingPeriod === "monthly"
        ? "STRIPE_PRICE_SCHOOL_MONTHLY"
        : "STRIPE_PRICE_SCHOOL_ANNUAL";
  const priceId = process.env[envVar];
  if (!priceId) throw new Error(`${envVar} is not set`);
  return priceId;
}

/**
 * Reverse of getStripePriceId: which plan a live Stripe price belongs to.
 *
 * Needed because a subscription's plan can change after checkout -- a customer
 * switching plans in the Customer Portal never touches the metadata written at
 * checkout, so metadata is only trustworthy as the plan at signup. The price on
 * the subscription item is the actual current truth.
 *
 * Returns null for an unrecognized price (an old price id, or one created in
 * the dashboard without a matching env var) so callers can leave the stored
 * plan alone rather than overwriting it with a guess.
 */
export function planForStripePriceId(priceId: string): BillingPlan | null {
  const byEnv: Array<[string | undefined, BillingPlan]> = [
    [process.env.STRIPE_PRICE_PILOT_MONTHLY, "pilot"],
    [process.env.STRIPE_PRICE_PILOT_ANNUAL, "pilot"],
    [process.env.STRIPE_PRICE_SCHOOL_MONTHLY, "school_pro"],
    [process.env.STRIPE_PRICE_SCHOOL_ANNUAL, "school_pro"],
  ];
  for (const [configured, plan] of byEnv) {
    if (configured && configured === priceId) return plan;
  }
  return null;
}

/** App origin for Stripe's success_url/cancel_url and the Customer Portal's return_url -- see lib/email.ts's appOrigin() for the resolution chain. */
export function getAppBaseUrl(): string {
  return appOrigin() ?? "http://localhost:3000";
}
