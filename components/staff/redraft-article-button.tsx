"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pollDraftJob } from "@/lib/content/poll-draft-job";

/**
 * Rewrites an article with the current pipeline. Confirmed first, because it
 * replaces text that may have been edited by hand, and unpublishes.
 *
 * Polls rather than holding the request open -- a rewrite runs the same
 * research pass and four model calls as a fresh draft, which takes minutes.
 */
export function RedraftArticleButton({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  // The stage the job reports, shown in place of a spinner. A run that stalls
  // then says which step it stalled on, which is the difference between a
  // report and a shrug.
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!window.confirm("Rewrite this article from scratch? The current text is replaced and it returns to draft.")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/redraft`, { method: "POST" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || `Request failed (${response.status})`);
      }
      const { jobId } = (await response.json()) as { jobId: string };
      await pollDraftJob(jobId, setStage);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't redraft.");
    } finally {
      setBusy(false);
      setStage("");
    }
  }

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
      className="font-medium text-white/60 hover:text-white disabled:opacity-60"
    >
      {busy ? `${stage || "Starting"}…` : "Redraft"}
    </button>
  );
}
