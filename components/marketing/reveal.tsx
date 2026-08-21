"use client";

import type { ReactNode } from "react";
import { useInView } from "@/lib/marketing/use-in-view";
import { cn } from "@/lib/utils";

/**
 * Marketing sections' scroll-triggered fade-up, via useInView's
 * IntersectionObserver (see lib/marketing/use-in-view.ts) -- previously pure
 * CSS via animation-timeline: view(), but that's still unsupported in enough
 * browsers that large swaths of visitors saw no reveal at all (content just
 * appeared immediately, the designed fallback -- correct in theory, but it
 * meant "no animation" for anyone on an unsupported browser rather than "no
 * animation only when they've asked for reduced motion"). IntersectionObserver
 * is native and cheap: no scroll listeners, no layout thrashing, and this
 * hook disconnects itself after the first trigger.
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
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-out",
        inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className,
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
