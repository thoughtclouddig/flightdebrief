import Link from "next/link";
import { Reveal } from "@/components/marketing/reveal";
import { TrackedLink } from "@/components/marketing/tracked-link";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-[#101727] px-6 py-28 text-center sm:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#171f33_0%,_#0c1220_75%)]" />

      <div className="relative mx-auto max-w-2xl">
        <Reveal>
          <p className="font-display text-balance text-lg italic leading-snug text-white/70 sm:text-xl">
            &ldquo;After four decades of flying, I still [debrief] after every flight.&rdquo;
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
            <span className="block whitespace-nowrap">William E. Dubois</span>
            <span className="mt-1 block text-pretty font-normal normal-case tracking-normal text-white/35">
              Pilot, Instructor &amp; FAA Safety Team Representative
            </span>
          </p>
        </Reveal>

        {/* Clamped rather than text-4xl/sm:text-5xl. The stated break needs
            "Make your next flight" to fit on one line, and at 36px that wants
            451px against a 327px column on a phone -- so both halves wrapped
            and "last." ended up alone on a fourth line. 3rem keeps the old
            desktop size; leading is stated because an arbitrary text-[...]
            carries no line-height of its own. */}
        <Reveal delay={80}>
          <h2 className="font-display mt-12 text-balance text-[clamp(1.5rem,6.6vw,3rem)] font-extrabold leading-[1.05] text-white">
            Make your next flight
            <br />
            <span className="text-brand">build on the last.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-pretty text-lg leading-relaxed text-white/75">
            Turn your flight, your instructor&rsquo;s feedback, and your between-flight training into a clear path
            forward.
          </p>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-white/75">
            <li className="text-pretty">No credit card required</li>
            <li className="text-pretty">Free to start</li>
            <li className="text-pretty">Cancel anytime</li>
          </ul>
        </Reveal>

        <Reveal delay={150} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <TrackedLink
            href="/signup"
            event="start_free"
            className="rounded-lg bg-brand px-8 py-3.5 text-sm font-semibold text-white hover:bg-brand-bright"
          >
            Try AfterFlight Free
          </TrackedLink>
          <Link
            href="/#overview"
            className="rounded-lg border border-white/20 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            See How It Works
          </Link>
        </Reveal>

        <Reveal delay={250}>
          <p className="text-pretty mt-6 text-xs text-white/55">Join pilots and instructors improving every day.</p>
        </Reveal>
      </div>
    </section>
  );
}
