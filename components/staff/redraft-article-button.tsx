"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Rewrites an article with the current prompt. Confirmed first, because it
 * replaces text that may have been edited by hand, and unpublishes.
 */
export function RedraftArticleButton({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!window.confirm("Rewrite this article from scratch? The current text is replaced and it returns to draft.")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/redraft`, { method: "POST" });
      if (!response.ok) throw new Error(await response.text());
      router.refresh();
    } catch {
      setError("Couldn't redraft.");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <span className="text-sm text-danger">{error}</span>;

  return (
    <button
      type="button"
      onClick={submit}
      disabled={busy}
      className="font-medium text-white/60 hover:text-white disabled:opacity-60"
    >
      {busy ? "Writing…" : "Redraft"}
    </button>
  );
}
