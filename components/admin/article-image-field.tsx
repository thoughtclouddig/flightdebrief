"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The hero image control.
 *
 * A generated image is stored as a data: URL, and putting that in a text
 * input meant the field showed four thousand characters of base64 -- unusable
 * as a control and impossible to tell apart from any other image at a glance.
 *
 * So a stored image is shown as the image, with actions on it. The raw URL
 * field only appears for the case it's actually good at: pasting an https://
 * link to a picture from somewhere else.
 */
export function ArticleImageField({
  articleId,
  value,
  onChange,
}: {
  /** Null before the article exists -- regeneration needs something to attach to. */
  articleId: string | null;
  value: string;
  onChange: (next: string) => void;
}) {
  const [direction, setDirection] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = value.trim();
  const isGenerated = trimmed.startsWith("data:");

  async function regenerate() {
    if (!articleId) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      if (!response.ok) {
        // Surface what the server said. "Try again" is not actionable, and
        // the generation chain fails for reasons a person can act on -- a
        // content-policy rejection, a rate limit, a missing key -- all of
        // which were being thrown away here.
        const body = (await response.json().catch(() => null)) as
          | { error?: string; detail?: string }
          | null;
        throw new Error(body?.detail || body?.error || `Image generation failed (${response.status})`);
      }
      const data = (await response.json()) as { imageUrl: string | null };
      if (data.imageUrl) onChange(data.imageUrl);
      setDirection("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't generate an image. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Label>Hero image</Label>

      {trimmed ? (
        <div className="mt-1.5 flex flex-col gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- renders both https:// and data: URLs */}
          <img src={trimmed} alt="" className="aspect-video w-full max-w-md rounded-lg object-cover" />
          <p className="text-xs text-foreground-faint">
            {isGenerated ? "Generated · stored with the article" : trimmed}
          </p>
        </div>
      ) : (
        <p className="mt-1.5 text-sm text-foreground-faint">No image yet.</p>
      )}

      {articleId ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          {/* The steer matters more than the button. Regenerating an unchanged
              prompt mostly returns the same idea with different pixels; what
              someone rejecting an image usually wants is a different idea. */}
          <Input
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            placeholder="Optional: what to change (e.g. on the ramp at dusk, no people)"
            className="sm:flex-1"
          />
          <button
            type="button"
            onClick={regenerate}
            disabled={busy}
            className="rounded-lg border border-hairline px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-sunken disabled:opacity-60"
          >
            {busy ? "Generating…" : trimmed ? "Regenerate" : "Generate"}
          </button>
          {trimmed ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground-soft transition-colors hover:text-foreground"
            >
              Remove
            </button>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-xs text-foreground-faint">Save the article first to generate an image for it.</p>
      )}

      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-foreground-faint hover:text-foreground-soft">
          Use an image from a URL instead
        </summary>
        <Input
          className="mt-2"
          placeholder="https://..."
          value={isGenerated ? "" : trimmed}
          onChange={(e) => onChange(e.target.value)}
        />
      </details>
    </div>
  );
}
