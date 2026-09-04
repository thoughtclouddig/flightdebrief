"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { trackEvent } from "@/lib/marketing/analytics";

export function SubscribeButton({
  billingPeriod,
  quantity,
  children,
  ...buttonProps
}: {
  billingPeriod: "monthly" | "annual";
  quantity?: number;
} & Omit<ButtonProps, "onClick" | "disabled">) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingPeriod, quantity }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) throw new Error(data?.error || "Couldn't start checkout.");
      trackEvent("checkout_started", {
        billing_period: billingPeriod,
        quantity: quantity ?? 1,
      });
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start checkout.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button onClick={subscribe} disabled={loading} {...buttonProps}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {children}
      </Button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
