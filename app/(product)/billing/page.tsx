import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubscribeButton } from "@/components/billing/subscribe-button";
import { ManageBillingButton } from "@/components/billing/manage-billing-button";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { hasActiveSubscription } from "@/lib/billing-gate";
import { computeStudentFreeFlights } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

const PLAN_LABEL: Record<string, string> = { pilot: "Pilot", school_pro: "Flight School Pro" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const viewer = await getViewer();
  const org = viewer.organization;
  const subscribed = hasActiveSubscription(org);

  const repo = getRepository();
  // Only an individual (solo pilot) org has a free-usage cap to compute at
  // all now -- independent CFI and school orgs are both free forever (see
  // isBillingBlocked's own comment on the school decision), so there's
  // nothing here worth a query for either.
  const needsUsage = org.kind === "individual";
  const flights = needsUsage ? await repo.listFlights({ organizationId: org.id }) : [];
  const usage = computeStudentFreeFlights(flights);

  if (org.demoExpiresAt) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
          <p className="mt-1 text-sm text-foreground-soft">{org.name}</p>
        </div>
        <Card>
          <CardContent className="py-5 text-sm text-foreground-soft">
            Billing isn&rsquo;t available in this live demo -- sign up for a real account to subscribe.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-foreground-soft">{org.name}</p>
      </div>

      {checkout === "success" ? (
        <Card className="border-good/40">
          <CardContent className="flex items-center gap-2 py-4 text-sm font-medium text-good">
            <CheckCircle2 className="size-4 shrink-0" />
            Subscription active -- thanks for subscribing.
          </CardContent>
        </Card>
      ) : null}
      {checkout === "cancelled" ? (
        <Card className="border-hairline">
          <CardContent className="py-4 text-sm text-foreground-soft">
            Checkout was cancelled -- no charge was made.
          </CardContent>
        </Card>
      ) : null}

      {subscribed ? (
        <Card>
          <CardHeader>
            <CardTitle>Current plan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="font-medium text-foreground">
                {org.subscriptionPlan ? PLAN_LABEL[org.subscriptionPlan] : "Subscribed"}
                {org.kind === "school" ? ` -- ${org.subscriptionQuantity} location${org.subscriptionQuantity === 1 ? "" : "s"}` : ""}
              </p>
              <p className="text-sm text-foreground-soft">Status: {org.subscriptionStatus}</p>
            </div>
            <ManageBillingButton />
          </CardContent>
        </Card>
      ) : org.kind === "independent_cfi" || org.kind === "school" ? (
        <Card>
          <CardContent className="py-5 text-sm text-foreground-soft">
            {org.kind === "school"
              ? "Free for your school -- no debrief limit, and nothing to subscribe to here."
              : "CFI accounts are free forever -- there’s nothing to subscribe to here."}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Pilot Plan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-foreground-soft">
              {usage.exhausted ? `You've used all ${usage.cap} free flights. Subscribe to keep going.` : `${usage.remaining} of ${usage.cap} free flights left.`}
            </p>
            {/* flex-wrap because buttonVariants sets whitespace-nowrap: side
                by side at sm, two lg buttons couldn't shrink and the annual
                one overflowed the card's padding. Wrapping to a second line
                is the correct fallback; shorter labels mean it usually
                doesn't have to. */}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <SubscribeButton billingPeriod="monthly" size="lg">
                Monthly -- $19.99/mo
              </SubscribeButton>
              <SubscribeButton billingPeriod="annual" size="lg" variant="outline">
                Annual -- $169/yr
              </SubscribeButton>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
