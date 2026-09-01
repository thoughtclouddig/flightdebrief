"use client";

import { useRef } from "react";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStored } from "@/lib/prototype/use-stored";
import { STUDENT } from "@/lib/prototype/vector-data";

const KEY = "af-prototype-avatar";

/**
 * The student's photo, with upload.
 *
 * Stored as a data URL in localStorage. That is exactly how the shipped app
 * already handles `users.avatar_url` -- a small image kept directly in a text
 * column rather than an object-storage bucket -- so this prototype uses the
 * same shape and no new infrastructure. Swapping localStorage for the
 * repository later is a one-line change at this seam.
 *
 * Initials are the fallback rather than a generic person icon: a silhouette
 * says "no account", initials say "this is you, without a photo yet".
 */
export function Avatar({ size = 40, editable = false }: { size?: number; editable?: boolean }) {
  const [src, setSrc] = useStored(KEY);
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    // Every Avatar on screen shares the key, so the header updates the moment
    // the photo is picked on the profile screen.
    reader.onload = () => setSrc(String(reader.result));
    reader.readAsDataURL(file);
  }

  const initials = STUDENT.fullName
    .split(" ")
    .map((n) => n[0])
    .join("");

  const circle = (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-sunken font-semibold text-foreground-soft"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {/* Plain img, not next/image: the source is a data: URL the optimizer
          cannot process, and it is already exactly the size we render. */}
      {src ? <img src={src} alt="" className="size-full object-cover" /> : initials}
    </span>
  );

  if (!editable) return circle;

  return (
    <div className="relative">
      {circle}
      <button
        onClick={() => fileRef.current?.click()}
        aria-label="Change profile photo"
        className={cn(
          "absolute -bottom-0.5 -right-0.5 flex size-8 cursor-pointer items-center justify-center rounded-full",
          "border-2 border-surface bg-brand text-on-brand transition-transform duration-200 active:scale-95",
        )}
      >
        <Camera className="size-4" aria-hidden />
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="sr-only" />
    </div>
  );
}
