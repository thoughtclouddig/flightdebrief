"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Fills the idea queue from the desk.
 *
 * The same action exists on /super-admin/ideas, but that page became
 * unreachable when Ideas, Articles and Research collapsed into one Content
 * tab: the desk links to it from an idea row, and there is no idea row when
 * the queue is empty. So the only way to get ideas required already having
 * ideas. It belongs here, next to the other things that start work.
 */
export function ProposeIdeasButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function propose() {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/admin/content/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 5 }),
      });
      const body = (await res.json().catch(() => null)) as
        | { topic?: string; ideas?: unknown[]; error?: string }
        | null;
      if (!res.ok) throw new Error(body?.error || "Couldn't propose ideas.");
      const count = body?.ideas?.length ?? 0;
      setNote(`${count} idea${count === 1 ? "" : "s"} proposed${body?.topic ? ` for ${body.topic}` : ""}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't propose ideas.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button variant="outline" size="sm" disabled={busy} onClick={propose}>
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
        Propose ideas
      </Button>
      {error ? <p className="max-w-xs text-right text-xs text-danger">{error}</p> : null}
      {note ? <p className="max-w-xs text-right text-xs text-white/50">{note}</p> : null}
    </div>
  );
}
