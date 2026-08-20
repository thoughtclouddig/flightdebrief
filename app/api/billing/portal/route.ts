import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getAppBaseUrl, getStripeClient } from "@/lib/stripe";

/**
 * Hands billing management (cancel, update card, change School Pro's
 * location quantity) off to Stripe's own hosted Customer Portal rather than
 * building any of that UI ourselves.
 */
export async function POST() {
  const auth = await authorize();
  if (auth.response) return auth.response;
  const { viewer } = auth;

  if (viewer.organization.kind === "school" && viewer.role !== "admin") {
    return NextResponse.json({ error: "Only an admin can manage this school's billing" }, { status: 403 });
  }
  if (!viewer.organization.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account yet -- subscribe first" }, { status: 400 });
  }

  try {
    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: viewer.organization.stripeCustomerId,
      return_url: `${getAppBaseUrl()}/billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing] failed to create portal session:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Couldn't open billing portal. Try again." }, { status: 502 });
  }
}
