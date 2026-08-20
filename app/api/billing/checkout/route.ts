import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { getAppBaseUrl, getStripeClient, getStripePriceId, type BillingPeriod } from "@/lib/stripe";
import type { BillingPlan } from "@/lib/types";

interface CreateCheckoutBody {
  billingPeriod: BillingPeriod;
  /** School Pro only -- number of locations. Ignored for Pilot (always 1). */
  quantity?: number;
}

/**
 * Starts a Stripe Checkout session for the caller's own organization. The
 * plan is derived from the org's kind, not taken from the request body --
 * an "individual" org can only buy Pilot, a "school" org can only buy School
 * Pro, so there is nothing for a client to spoof here.
 */
export async function POST(request: Request) {
  const auth = await authorize();
  if (auth.response) return auth.response;
  const { viewer } = auth;

  const org = viewer.organization;
  let plan: BillingPlan;
  if (org.kind === "individual") {
    plan = "pilot";
  } else if (org.kind === "school") {
    if (viewer.role !== "admin") {
      return NextResponse.json({ error: "Only an admin can manage this school's billing" }, { status: 403 });
    }
    plan = "school_pro";
  } else {
    // independent_cfi orgs are free forever -- there is nothing to subscribe to.
    return NextResponse.json({ error: "This account has no paid plan to subscribe to" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as CreateCheckoutBody | null;
  const billingPeriod: BillingPeriod = body?.billingPeriod === "annual" ? "annual" : "monthly";
  const quantity = plan === "school_pro" ? Math.max(1, Math.floor(body?.quantity ?? 1)) : 1;

  try {
    const stripe = getStripeClient();
    const repo = getRepository();
    const baseUrl = getAppBaseUrl();

    // Reuse the org's existing Stripe customer if this isn't their first checkout
    // (e.g. resubscribing after a cancellation), instead of creating a duplicate.
    const customerId =
      org.stripeCustomerId ??
      (
        await stripe.customers.create({
          name: org.name,
          email: viewer.user.email,
          metadata: { organizationId: org.id },
        })
      ).id;
    if (!org.stripeCustomerId) {
      await repo.updateOrganizationBilling(org.id, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: org.id,
      line_items: [{ price: getStripePriceId(plan, billingPeriod), quantity }],
      subscription_data: { metadata: { organizationId: org.id, plan } },
      // Shows a promo/coupon code field on the Checkout page.
      allow_promotion_codes: true,
      // Skips card collection when a coupon zeroes out the total due today --
      // without this, Stripe always asks for a card up front (it still might
      // need one for a future non-zero renewal), even if nothing is owed now.
      payment_method_collection: "if_required",
      success_url: `${baseUrl}/billing?checkout=success`,
      cancel_url: `${baseUrl}/billing?checkout=cancelled`,
    });

    if (!session.url) throw new Error("Stripe did not return a Checkout URL");
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing] failed to create checkout session:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Couldn't start checkout. Try again." }, { status: 502 });
  }
}
