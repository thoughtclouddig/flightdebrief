import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getRepository } from "@/lib/data";
import { planForStripePriceId, getStripeClient } from "@/lib/stripe";
import type { BillingPlan } from "@/lib/types";

/**
 * Stripe is the source of truth for subscription state -- this is the only
 * place organizations.stripe_* / subscription_* columns get written. Every
 * event is verified against STRIPE_WEBHOOK_SECRET before being trusted (see
 * lib/auth/session.ts's SESSION_SECRET for the same fail-loudly-if-missing
 * convention on a required secret).
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set -- refusing to process events");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const repo = getRepository();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.client_reference_id;
        if (!organizationId || typeof session.subscription !== "string") break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const plan = subscription.metadata.plan as BillingPlan | undefined;
        await repo.updateOrganizationBilling(organizationId, {
          stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          subscriptionPlan: plan,
          subscriptionQuantity: subscription.items.data[0]?.quantity ?? 1,
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata.organizationId;
        if (!organizationId) break;

        // Plan is derived from the price on the subscription item, not from
        // metadata: metadata is written once at checkout and a portal-driven
        // plan switch never updates it, so trusting it here would leave the
        // billing page showing the old plan while Stripe billed the new one.
        // An unrecognized price returns null, which leaves the stored plan
        // untouched rather than clearing it.
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = priceId ? planForStripePriceId(priceId) : null;

        await repo.updateOrganizationBilling(organizationId, {
          subscriptionStatus: subscription.status,
          subscriptionQuantity: subscription.items.data[0]?.quantity ?? 1,
          subscriptionPlan: plan ?? undefined,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata.organizationId;
        if (!organizationId) break;

        await repo.updateOrganizationBilling(organizationId, { subscriptionStatus: "canceled" });
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`[stripe-webhook] failed handling ${event.type}:`, err instanceof Error ? err.message : err);
    // Still 200 -- a DB hiccup on our end shouldn't make Stripe retry forever
    // and pile up duplicate-looking events; the org's status will catch up
    // on the next webhook (subscriptions fire updated events frequently).
  }

  return NextResponse.json({ received: true });
}
