"use client";

import { useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Wraps the usual external study-resource link with a fire-and-forget
 * "mark viewed" POST -- doesn't block or delay navigation, and shows the
 * checkmark immediately on click rather than waiting on the request.
 */
export function StudyResourceLink({
  url,
  label,
  initiallyViewed,
  className,
}: {
  url: string;
  label: string;
  initiallyViewed: boolean;
  className?: string;
}) {
  const [viewed, setViewed] = useState(initiallyViewed);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        if (viewed) return;
        setViewed(true);
        fetch("/api/study-resources/viewed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }).catch(() => {});
      }}
      className={cn("inline-flex w-fit items-center gap-1.5 text-sm text-brand hover:underline", className)}
    >
      {viewed ? <Check className="size-3.5 shrink-0 text-good" /> : null}
      {label}
      <ExternalLink className="size-3 shrink-0" />
    </a>
  );
}
