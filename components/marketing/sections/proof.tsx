import type { ReactNode } from "react";

/** Same fade/rise pattern as components/marketing/reveal.tsx, but with more
 * upward travel and a slower, gentler ease -- scoped to this section only. */
function RevealUp({ children, className }: { children: ReactNode; className?: string; delay?: number }) {
  return <div className={className}>{children}</div>;
}

export function Proof() {
  return (
    <section className="bg-white px-6 py-28 sm:py-40">
      <div className="mx-auto max-w-3xl text-center">
        <RevealUp>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">The Proof</p>
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
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8c97a2]">According to studies by</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            <span className="font-display text-xl font-bold tracking-[0.1em] text-[#4b545d]">FAA</span>
            <span className="h-5 w-px bg-[#d5d9dd]" aria-hidden="true" />
            <span className="font-display text-xl font-bold tracking-[0.1em] text-[#4b545d]">NASA</span>
            <span className="h-5 w-px bg-[#d5d9dd]" aria-hidden="true" />
            <span className="font-display text-xl font-bold tracking-[0.1em] text-[#4b545d]">Human Factors</span>
          </div>
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
