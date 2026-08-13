"use client";

import type { ReactNode } from "react";
import { useInView } from "@/lib/marketing/use-in-view";
import { cn } from "@/lib/utils";

/** Fades/rises a section into place once, the first time it scrolls into view. */
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
        "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className,
      )}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
