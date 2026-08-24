"use client";

import { useState } from "react";
import { Info } from "lucide-react";

/** Small "i" affordance next to a card title explaining what the metric means -- click/tap to toggle (works on touch, not just hover), closes on blur. */
export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="What does this mean?"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="text-foreground-faint transition-colors hover:text-foreground-soft"
      >
        <Info className="size-3.5" />
      </button>
      {open ? (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-30 mt-2 w-64 -translate-x-1/2 rounded-lg border border-hairline bg-surface p-2.5 text-xs font-normal leading-snug text-foreground-soft shadow-lg"
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}
