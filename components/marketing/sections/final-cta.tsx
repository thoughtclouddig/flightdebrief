import Link from "next/link";
import { Reveal } from "@/components/marketing/reveal";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-[#101727] px-6 py-28 text-center sm:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#171f33_0%,_#0c1220_75%)]" />

      <div className="relative mx-auto max-w-2xl">
        <Reveal>
          <h2 className="font-display text-balance text-4xl font-extrabold uppercase leading-[1.02] text-white sm:text-5xl">
            Your next lesson shouldn&rsquo;t start with &ldquo;Where did we leave off?&rdquo;
          </h2>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-white/75">
            Record the debrief. Remember the lesson. Come back ready to fly.
          </p>
        </Reveal>

        <Reveal delay={150} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/app" className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark">
            Start with AfterFlight
          </Link>
          <Link href="#schools" className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
            Bring AfterFlight to Your Flight School
          </Link>
        </Reveal>

        <Reveal delay={250}>
          <p className="mt-6 text-xs text-white/55">The debrief you already have. Nothing new to learn.</p>
        </Reveal>
      </div>
    </section>
  );
}
