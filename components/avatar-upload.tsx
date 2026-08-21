"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, X } from "lucide-react";

const OUTPUT_SIZE = 256;

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("");
}

/** Crops to a centered square and downscales -- keeps the stored data: URL small since it's inline in Postgres, not object storage. */
function resizeToSquareDataUrl(img: HTMLImageElement): string {
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  return canvas.toDataURL("image/jpeg", 0.85);
}

/**
 * Profile photo circle -- shows the image when set, initials otherwise, with
 * a camera badge that opens a file picker. Resizes/crops/compresses client-side
 * before upload since there's no object storage in this app; see the
 * users.avatar_url doc comment in db/schema.sql for why it's stored inline.
 */
export function AvatarUpload({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(avatarDataUrl: string | null) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarDataUrl }),
      });
      if (!res.ok) throw new Error("Failed to update photo. Try again.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update photo. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        save(resizeToSquareDataUrl(img));
      } catch {
        setError("Couldn't process that image. Try a different one.");
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError("Couldn't read that image. Try a different one.");
    };
    img.src = objectUrl;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative size-12 shrink-0">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- data: URL, not an optimizable remote asset
          <img src={avatarUrl} alt="" className="size-12 rounded-full object-cover" />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-lg font-semibold text-brand-dark dark:bg-brand/20 dark:text-brand-light">
            {initials(name)}
          </div>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={saving}
          aria-label="Change photo"
          className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border border-hairline bg-surface text-foreground-faint hover:text-foreground"
        >
          {saving ? <Loader2 className="size-3 animate-spin" /> : <Camera className="size-3" />}
        </button>

        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>

      {avatarUrl ? (
        <button
          type="button"
          onClick={() => save(null)}
          disabled={saving}
          className="flex items-center gap-1 text-xs text-foreground-faint hover:text-foreground"
        >
          <X className="size-3" />
          Remove photo
        </button>
      ) : null}

      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
