"use client";

import type { ReactNode } from "react";
import { useInView } from "@/lib/marketing/use-in-view";
import { cn } from "@/lib/utils";

/**
 * Same fade/rise pattern as components/marketing/reveal.tsx, but with more
 * upward travel for a slower, gentler feel -- scoped to this section only.
 * See Reveal's doc comment for why this uses useInView's IntersectionObserver
 * instead of animation-timeline: view().
 */
function RevealUp({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-1000 ease-out",
        inView ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0",
        className,
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

export function Proof() {
  return (
    <section className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <RevealUp>
          <p className="text-balance text-base font-bold uppercase tracking-[0.16em] text-brand sm:text-lg">The Proof</p>
          <p className="font-display mt-6 text-balance text-4xl font-bold sm:text-5xl">
            <span className="text-[#101727]">The</span> <span className="text-brand">proven power</span>{" "}
            <span className="text-[#101727]">of structured debriefing.</span>
          </p>
        </RevealUp>

        <RevealUp
          delay={200}
          className="font-display tabular-nums -mt-4 flex items-start justify-center leading-none text-brand sm:-mt-8"
        >
          <span className="whitespace-nowrap text-[clamp(9rem,7rem+18vw,27rem)] font-extrabold tracking-[-0.05em]">
            25
          </span>
          <span className="mt-10 text-[clamp(3.5rem,2.5rem+6vw,8rem)] font-extrabold sm:mt-20">%</span>
        </RevealUp>

        <RevealUp
          delay={400}
          className="font-display -mt-6 text-balance font-bold leading-none text-[#101727] sm:-mt-10"
        >
          <span className="text-[clamp(3.5rem,2rem+9vw,8rem)]">Better</span>{" "}
          <span className="text-[clamp(2.25rem,1rem+5.5vw,4.5rem)]">Performance</span>
        </RevealUp>

        <RevealUp delay={600} className="mx-auto mt-10 border-t border-[#e4e7ea] pt-8">
          <p className="text-balance text-xs font-bold uppercase tracking-[0.16em] text-[#68717D]">According to studies by</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-x-8">
            <span className="font-display text-base font-bold tracking-[0.06em] text-[#4b545d] sm:text-xl sm:tracking-[0.1em]">
              FAA
            </span>
            <span className="h-5 w-px bg-[#d5d9dd]" aria-hidden="true" />
            <span className="font-display text-base font-bold tracking-[0.06em] text-[#4b545d] sm:text-xl sm:tracking-[0.1em]">
              NASA
            </span>
            <span className="h-5 w-px bg-[#d5d9dd]" aria-hidden="true" />
            <span className="font-display text-base font-bold tracking-[0.06em] text-[#4b545d] sm:text-xl sm:tracking-[0.1em]">
              Human Factors
            </span>
          </div>
        </RevealUp>

        <RevealUp delay={750} className="mx-auto mt-8 max-w-md text-center sm:max-w-lg">
          <p className="text-base text-[#68717D]">46 studies &middot; 2,136 participants</p>

          <p className="mt-6 text-pretty text-xs leading-relaxed text-[#68717D]">
            Sources: FAA Aviation Instructor&rsquo;s Handbook &middot; NASA aviation training research
            <br />
            Tannenbaum &amp; Cerasoli, Human Factors
          </p>
        </RevealUp>
      </div>
    </section>
  );
}
