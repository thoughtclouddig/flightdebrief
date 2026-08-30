"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import type { ArticleImagePrompt } from "@/lib/types";
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
const PART_FIELDS: { key: keyof ArticleImagePrompt; label: string; hint: string }[] = [
  { key: "scene", label: "Scene", hint: "Where it happens and what is in it" },
  { key: "subjects", label: "Subjects", hint: "Who is in frame and what they are doing — blank for an empty scene" },
  { key: "aircraft", label: "Aircraft", hint: "Type and configuration — blank if no aeroplane belongs" },
  { key: "light", label: "Light", hint: "Time of day, direction, quality" },
  { key: "camera", label: "Camera", hint: "Focal length, distance, angle, depth of field" },
];

const EMPTY: ArticleImagePrompt = {
  scene: "",
  subjects: "",
  aircraft: "",
  light: "",
  camera: "",
  rationale: "",
};

export function ArticleImageField({
  articleId,
  value,
  prompt,
  onChange,
  onPromptChange,
}: {
  /** Null before the article exists -- regeneration needs something to attach to. */
  articleId: string | null;
  value: string;
  /** The shot brief the current image came from, if there is one. */
  prompt: ArticleImagePrompt | null;
  onChange: (next: string) => void;
  onPromptChange: (next: ArticleImagePrompt | null) => void;
}) {
  const [direction, setDirection] = useState("");
  const [parts, setParts] = useState<ArticleImagePrompt>(prompt ?? EMPTY);
  const [editing, setEditing] = useState(false);
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
        // Send the edited brief when the editor has been in it. The writer
        // is skipped entirely then -- someone who changed the light should
        // get exactly that, not a fresh scene that happens to be lit
        // differently.
        body: JSON.stringify({ direction, parts: editing ? parts : undefined }),
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
      const data = (await response.json()) as {
        imageUrl: string | null;
        parts: ArticleImagePrompt | null;
      };
      if (data.imageUrl) onChange(data.imageUrl);
      if (data.parts) {
        setParts(data.parts);
        onPromptChange(data.parts);
      }
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

      {/* The shot brief, as separate parts. Editable because regenerating an
          unchanged prompt returns the same idea with different pixels -- what
          someone rejecting an image usually wants is one element changed, and
          they could not previously see, let alone change, any of them. */}
      {articleId ? (
        <details className="mt-3" open={editing}>
          <summary
            className="cursor-pointer text-xs text-foreground-faint hover:text-foreground-soft"
            onClick={() => setEditing(true)}
          >
            Shot brief {prompt ? "" : "-- generate an image to fill this in"}
          </summary>

          {prompt?.rationale ? (
            <p className="mt-2 text-xs italic text-foreground-faint">{prompt.rationale}</p>
          ) : null}

          <div className="mt-2 flex flex-col gap-2">
            {PART_FIELDS.map((field) => (
              <label key={field.key} className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-foreground-soft">{field.label}</span>
                <textarea
                  value={parts[field.key]}
                  onChange={(e) => {
                    setEditing(true);
                    setParts((p) => ({ ...p, [field.key]: e.target.value }));
                  }}
                  rows={2}
                  placeholder={field.hint}
                  className="w-full rounded-lg border border-hairline bg-transparent p-2 text-sm text-foreground placeholder:text-foreground-faint focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </label>
            ))}
          </div>

          <p className="mt-2 text-xs text-foreground-faint">
            Edit any part and press Regenerate -- the edited brief is used exactly as written, and the writer
            is skipped.
          </p>
        </details>
      ) : null}

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
