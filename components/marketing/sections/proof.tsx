"use client";

import type { ReactNode } from "react";
import { useInView } from "@/lib/marketing/use-in-view";
import { cn } from "@/lib/utils";

/** Same fade/rise pattern as components/marketing/reveal.tsx, but with more
 * upward travel and a slower, gentler ease -- scoped to this section only. */
function RevealUp({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none motion-reduce:transform-none",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12",
        className,
      )}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

export function Proof() {
  return (
    <section className="bg-white px-6 py-28 sm:py-40">
      <div className="mx-auto max-w-3xl text-center">
        <RevealUp>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">The Proof</p>
          <p className="font-display mt-6 text-4xl font-bold sm:text-5xl">
            <span className="text-[#101727]">The</span> <span className="text-brand">proven power</span>
            <br />
            <span className="text-[#101727]">of structured debriefing.</span>
          </p>
        </RevealUp>

        <RevealUp
          delay={200}
          className="font-display tabular-nums -mt-4 flex items-start justify-center leading-none text-brand sm:-mt-8"
        >
          <span className="whitespace-nowrap text-[17rem] font-extrabold tracking-[-0.05em] sm:text-[27rem]">
            25
          </span>
          <span className="mt-10 text-7xl font-extrabold sm:mt-20 sm:text-9xl">%</span>
        </RevealUp>

        <RevealUp
          delay={400}
          className="font-display -mt-6 text-balance font-bold leading-none text-[#101727] sm:-mt-10"
        >
          <span className="text-8xl sm:text-9xl">Better</span> <span className="text-6xl sm:text-7xl">Performance</span>
        </RevealUp>

        <RevealUp
          delay={600}
          className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-[#e4e7ea] pt-8"
        >
          <span className="font-display text-base font-bold tracking-[0.1em] text-[#4b545d]">FAA</span>
          <span className="h-4 w-px bg-[#d5d9dd]" aria-hidden="true" />
          <span className="font-display text-base font-bold tracking-[0.1em] text-[#4b545d]">NASA</span>
          <span className="h-4 w-px bg-[#d5d9dd]" aria-hidden="true" />
          <span className="font-display text-base font-bold tracking-[0.1em] text-[#4b545d]">Human Factors</span>
        </RevealUp>

        <RevealUp delay={750} className="mx-auto mt-8 max-w-md text-center sm:max-w-lg">
          <p className="text-base text-[#8c97a2]">46 studies &middot; 2,136 participants</p>

          <p className="mt-6 text-pretty text-xs leading-relaxed text-[#8c97a2]">
            Sources: FAA Aviation Instructor&rsquo;s Handbook &middot; NASA aviation training research
            <br />
            Tannenbaum &amp; Cerasoli, Human Factors
          </p>
        </RevealUp>
      </div>
    </section>
  );
}
