"use client";

import type { ReactNode } from "react";
import { useInView } from "@/lib/marketing/use-in-view";
import { cn } from "@/lib/utils";

/**
 * Same one-shot scroll-triggered pattern as Reveal, but slides in from the
 * right instead of rising -- for rows in a list rather than whole sections.
 * See Reveal's doc comment for why this moved off animation-timeline: view()
 * to useInView's IntersectionObserver.
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
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-out",
        inView ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0",
        className,
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
