import { Users } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { PhotoVisual } from "@/components/marketing/app-screen";

/**
 * The payoff beat, right after "The Debrief" -- deliberately image-led and
 * short. The problem is already established (brand-moment.tsx); this section
 * doesn't re-argue it, it just shows the handoff from one lesson to the next.
 * Reuses PhotoVisual (the same image+flush-label treatment as the six
 * How-It-Works cards directly above) so this reads as one continuous idea
 * rather than a newly bolted-on component.
 */
export function NextFlightPayoff() {
  return (
    <section className="bg-white px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-[1100px]">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-balance text-lg font-bold uppercase tracking-[0.16em] text-brand sm:text-xl">
            Training Continuity
          </p>
          <h2 className="font-display mt-3 text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
            Every flight builds on the last one.
          </h2>
          <p className="mt-4 text-balance text-lg text-[#68717D]">
            AfterFlight turns every debrief into a clear plan for what comes next.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-2 sm:gap-8">
          <Reveal delay={100} className="flex flex-col gap-4">
            <PhotoVisual
              src="/images/marketing/next-flight-after-this-flight.avif"
              alt="A student pilot reviewing his AfterFlight debrief on his phone in the flight-school lounge"
              label="After This Flight"
            />
            <div>
              <p className="font-display text-balance text-xl font-bold text-[#101727]">The next lesson starts here.</p>
              <p className="text-pretty mt-2 text-base leading-relaxed text-[#68717D]">
                Know what to work on, what to study, and what comes next.
              </p>
            </div>
          </Reveal>

          <Reveal delay={200} className="flex flex-col gap-4">
            <PhotoVisual
              src="/images/marketing/next-flight-before-next-flight.avif"
              alt="A confident student pilot with a headset on in the cockpit, ready to fly"
              label="Before The Next Flight"
            />
            <div>
              <p className="font-display text-balance text-xl font-bold text-[#101727]">Ready for what comes next.</p>
              <p className="text-pretty mt-2 text-base leading-relaxed text-[#68717D]">
                Start the next lesson knowing exactly where you left off.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={300} className="mt-10 flex items-center justify-center gap-3">
          <Users className="size-5 shrink-0 text-brand" />
          <p className="text-balance text-lg font-medium text-[#101727]">Different instructor? Same training history.</p>
        </Reveal>
      </div>
    </section>
  );
}
