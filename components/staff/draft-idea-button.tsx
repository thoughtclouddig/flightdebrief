"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Drafts one queued idea, from the row it's sitting on.
 *
 * Fires the job and polls, rather than holding the request open: research,
 * four model calls, and an image take minutes, and Replit's proxy returns its
 * own 502 long before that -- reporting a failure for work that was still
 * running and did eventually land.
 */
const POLL_MS = 4000;
/** ~8 minutes. Past that, stop polling rather than spin forever. */
const MAX_POLLS = 120;

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

      for (let i = 0; i < MAX_POLLS; i++) {
        await new Promise((resolve) => setTimeout(resolve, POLL_MS));
        const status = await fetch(`/api/admin/content/draft-jobs/${jobId}`);
        if (!status.ok) continue;
        const job = (await status.json()) as { state: string; error: string | null };

        if (job.state === "done") {
          router.refresh();
          return;
        }
        if (job.state === "failed") throw new Error(job.error || "Drafting failed.");
        // "unknown" means the server forgot the job -- a restart, most
        // likely. The article may well exist, so refresh rather than claim a
        // failure for something that might have succeeded.
        if (job.state === "unknown") {
          router.refresh();
          return;
        }
      }
      throw new Error("Still writing after 8 minutes. Check the Articles tab.");
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
