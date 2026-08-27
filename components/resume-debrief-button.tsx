"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Finishes analyzing a recording that was saved while billing-blocked -- no re-recording needed, see app/api/debrief/analyze/route.ts. */
export function ResumeDebriefButton({ flightId }: { flightId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resume() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/debrief/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flightId }),
      });
      if (res.status === 402) {
        router.push("/billing");
        return;
      }
      if (!res.ok) throw new Error();
      router.push(`/flights/${flightId}/debrief/results`);
    } catch {
      setError("Something went wrong analyzing your debrief. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      <Button size="lg" className="h-16 w-full text-lg font-semibold" onClick={resume} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {loading ? "Analyzing…" : "Analyze Now"}
      </Button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
