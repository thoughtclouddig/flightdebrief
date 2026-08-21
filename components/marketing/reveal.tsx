import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Marketing sections' scroll-triggered fade-up. Pure CSS (see .reveal /
 * @keyframes reveal-fade-up in app/globals.css) via animation-timeline:
 * view() -- no client JS, no IntersectionObserver, no "use client" boundary.
 * Feature-detected there via @supports: browsers without scroll-driven
 * animation support just render the content immediately with no reveal,
 * same as having no animation at all -- never worse, better where supported.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div className={cn("reveal", className)} style={delay ? { animationDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}
