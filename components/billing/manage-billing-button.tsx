"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Redirects to Stripe's hosted Customer Portal -- cancel, update card, and (for School Pro) change the location quantity all happen there, not in this app. */
export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) throw new Error(data?.error || "Couldn't open billing portal.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't open billing portal.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button onClick={openPortal} disabled={loading} variant="outline">
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Manage Billing
      </Button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
