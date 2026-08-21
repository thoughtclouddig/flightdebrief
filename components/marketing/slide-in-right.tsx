import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Same one-shot scroll-triggered pattern as Reveal, but slides in from the
 * right instead of rising -- for rows in a list rather than whole sections.
 * Pure CSS via animation-timeline: view(), see .reveal-slide-right in
 * app/globals.css -- no client JS, no "use client" boundary.
 */
export function SlideInRight({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div className={cn("reveal-slide-right", className)} style={delay ? { animationDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}
