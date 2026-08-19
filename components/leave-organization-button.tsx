"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LeaveOrganizationButton({ organizationName }: { organizationName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function leave() {
    setLeaving(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/leave-organization", { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Something went wrong. Try again.");
        setLeaving(false);
        return;
      }
      // Full navigation -- every server component down the tree needs a
      // fresh getViewer() read of the newly-active membership cookie.
      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Try again.");
      setLeaving(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-foreground-soft">
          You&rsquo;ll leave <strong className="text-foreground">{organizationName}</strong> and continue training on
          your own AfterFlight account. Your CFI and school admin will no longer see your flights, but your existing
          history stays exactly as it is.
        </p>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="button" variant="destructive" size="sm" onClick={leave} disabled={leaving}>
            {leaving ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Yes, go solo
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={leaving}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-xs font-medium text-foreground-soft hover:text-danger hover:underline"
    >
      <LogOut className="size-3" />
      Leave {organizationName} &amp; go solo
    </button>
  );
}
