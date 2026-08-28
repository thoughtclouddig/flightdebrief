"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ArticleStatus } from "@/lib/types";

/**
 * Publish (or unpublish) straight from the preview, so the decision happens
 * where the evidence is rather than back in a form with a status dropdown.
 */
export function PublishArticleButton({ articleId, status }: { articleId: string; status: ArticleStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publishing = status !== "published";

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: publishing ? "published" : "draft" }),
      });
      if (!response.ok) throw new Error(await response.text());
      router.refresh();
    } catch {
      setError("Couldn't save that. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error ? <span className="text-sm text-danger">{error}</span> : null}
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className={
          publishing
            ? "rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-bright hover:text-[#101727] disabled:opacity-60"
            : "rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 disabled:opacity-60"
        }
      >
        {busy ? "Saving…" : publishing ? "Publish" : "Unpublish"}
      </button>
    </div>
  );
}
