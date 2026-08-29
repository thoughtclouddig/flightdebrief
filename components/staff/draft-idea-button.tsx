"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pollDraftJob } from "@/lib/content/poll-draft-job";

/**
 * Drafts one queued idea, from the row it's sitting on.
 *
 * Fires the job and polls, rather than holding the request open: research,
 * four model calls, and an image take minutes, and Replit's proxy returns its
 * own 502 long before that -- reporting a failure for work that was still
 * running and did eventually land.
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
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || `Request failed (${response.status})`);
      }
      const { jobId } = (await response.json()) as { jobId: string };
      await pollDraftJob(jobId);
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
      {busy ? "Researching and writing…" : "Draft now"}
    </button>
  );
}
