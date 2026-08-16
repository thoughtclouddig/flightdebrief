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
          <h2 className="font-display text-balance text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl">
            Ready to get better
            <br />
            every flight?
          </h2>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-white/75">
            <li>No credit card required</li>
            <li>7-day free trial</li>
            <li>Cancel anytime</li>
          </ul>
        </Reveal>

        <Reveal delay={150} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            onClick={() => trackEvent("start_free_trial")}
            className="rounded-lg bg-brand px-8 py-3.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Start Your Free Trial
          </Link>
        </Reveal>

        <Reveal delay={250}>
          <p className="mt-6 text-xs text-white/55">Join pilots and instructors improving every day.</p>
        </Reveal>
      </div>
    </section>
  );
}
