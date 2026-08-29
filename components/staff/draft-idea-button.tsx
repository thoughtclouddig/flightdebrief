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
  const [expanded, setExpanded] = useState(false);

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

  // Expandable rather than truncated. A hover title was not enough: an API
  // error puts the part that identifies the failure at the end, so the one
  // line shown was always the least useful half. Click to read it, and to
  // retry without reloading the desk.
  if (error) {
    return (
      <div className="flex max-w-[420px] flex-col items-start gap-1.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`text-left text-sm text-danger ${expanded ? "whitespace-pre-wrap break-words" : "line-clamp-2"}`}
          title={expanded ? "Collapse" : "Show the full error"}
        >
          {error}
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setExpanded(false);
          }}
          className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400 hover:text-slate-200"
        >
          Dismiss
        </button>
      </div>
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
