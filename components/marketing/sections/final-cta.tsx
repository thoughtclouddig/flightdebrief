"use client";

import Link from "next/link";
import { Reveal } from "@/components/marketing/reveal";
import { trackEvent } from "@/lib/marketing/analytics";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-[#101727] px-6 py-28 text-center sm:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#171f33_0%,_#0c1220_75%)]" />

      <div className="relative mx-auto max-w-2xl">
        <Reveal>
          <p className="font-display text-balance text-lg italic leading-snug text-white/70 sm:text-xl">
            &ldquo;After four decades of flying, I still [debrief] after every flight.&rdquo;
          </p>
          <p className="text-balance mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
            William E. Dubois <span className="font-normal normal-case text-white/35">&mdash; Pilot, Instructor &amp; FAA Safety Team Representative</span>
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="font-display mt-12 text-balance text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl">
            Ready to <span className="text-brand">get better</span>
            <br />
            every flight?
          </h2>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-white/75">
            <li className="text-balance">No credit card required</li>
            <li className="text-balance">Free to start</li>
            <li className="text-balance">Cancel anytime</li>
          </ul>
        </Reveal>

        <Reveal delay={150} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            onClick={() => trackEvent("start_free")}
            className="rounded-lg bg-brand px-8 py-3.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Start Free
          </Link>
        </Reveal>

        <Reveal delay={250}>
          <p className="text-balance mt-6 text-xs text-white/55">Join pilots and instructors improving every day.</p>
        </Reveal>
      </div>
    </section>
  );
}
