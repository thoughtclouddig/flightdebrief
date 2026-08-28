"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteFlightButton({ flightId }: { flightId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/flights/${flightId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to delete flight.");
        setDeleting(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Failed to delete flight -- check your connection and try again.");
      setDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <Button variant="outline" size="lg" onClick={() => setConfirming(true)} className="text-red-600 dark:text-red-400">
        <Trash2 className="size-4" />
        Delete flight
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
      <p className="text-sm text-red-700 dark:text-red-400">
        This permanently deletes this flight and its debrief and training data. This can&rsquo;t be undone.
      </p>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setConfirming(false)} disabled={deleting} className="flex-1">
          Cancel
        </Button>
        <Button variant="destructive" onClick={confirmDelete} disabled={deleting} className="flex-1">
          {deleting ? <Loader2 className="size-4 animate-spin" /> : null}
          Yes, delete it
        </Button>
      </div>
    </div>
  );
}
