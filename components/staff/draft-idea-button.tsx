"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Drafts one queued idea, from the row it's sitting on.
 *
 * Approving an idea moved it to a queue that only a separate header button
 * drained, oldest-first -- so from the desk, approving looked like it did
 * nothing. Writing takes a while, so the button says so rather than going
 * quiet for a minute.
 */
export function DraftIdeaButton({ ideaId }: { ideaId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/content/generate-daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId }),
      });
      if (!response.ok) {
        // Show the server's reason. A generic message here sent the last
        // debugging session hunting through logs for something the API
        // already knew.
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || `Request failed (${response.status})`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't draft that.");
    } finally {
      setBusy(false);
    }
  }

  // title as well as text: a real error message is often longer than the
  // column, and truncating the useful half is how you end up reading logs.
  if (error) {
    return (
      <span className="max-w-[420px] truncate text-sm text-danger" title={error}>
        {error}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={submit}
      disabled={busy}
      className="font-medium text-brand-bright hover:underline disabled:opacity-60"
    >
      {busy ? "Writing…" : "Draft now"}
    </button>
  );
}
