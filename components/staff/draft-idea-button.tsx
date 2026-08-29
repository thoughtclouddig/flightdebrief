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
  // The stage the job reports, shown in place of a spinner. A run that stalls
  // then says which step it stalled on, which is the difference between a
  // report and a shrug.
  const [stage, setStage] = useState("");
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
      await pollDraftJob(jobId, setStage);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't draft that.");
    } finally {
      setBusy(false);
      setStage("");
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
      {busy ? `${stage || "Starting"}…` : "Draft now"}
    </button>
  );
}
