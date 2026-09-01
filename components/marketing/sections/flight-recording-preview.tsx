import { Reveal } from "@/components/marketing/reveal";

/**
 * The native flight recorder, stated as unreleased.
 *
 * This replaced a four-state product-proof walkthrough of the recorder. That
 * section was accurate about the design and wrong about the tense: apps/mobile
 * has never been installed or run on a device, and background recording is
 * configured rather than verified -- the locked-screen, ForeFlight-in-front
 * case it advertised is precisely the one still untested. Marketing a claim
 * the release gate has not passed is how a product gets checked once and never
 * trusted again, and a chief instructor is exactly the reader who will check.
 *
 * Kept as a teaser rather than deleted, because the direction is real and
 * worth signalling while the concept is being tested. Kept deliberately small:
 * no mocked screens and no buttons. A "Start Flight" button rendered in brand
 * orange reads as shippable UI regardless of the label above it, and this
 * section sits below the shipped product for the same reason -- what works
 * today should outrank what is coming.
 *
 * Every verb here is future tense. If that changes before a device test
 * passes, the change is wrong.
 */
export function FlightRecordingPreview() {
  return (
    <section id="flight-recording" className="bg-white px-6 py-20 sm:py-24">
      <Reveal className="mx-auto max-w-[720px]">
        <p className="inline-flex items-center rounded-full border border-brand/30 bg-brand/[0.07] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand">
          In development
        </p>

        <h2 className="font-display mt-5 text-balance text-3xl font-bold leading-tight text-[#101727] sm:text-4xl">
          Next: start the flight, then put the phone away.
        </h2>

        <p className="mt-5 text-pretty text-lg leading-relaxed text-[#68717D]">
          Today you tell AfterFlight what you flew. We&rsquo;re building a native app that will record the flight
          in the background while you fly, so your debrief can point at a specific approach instead of a
          remembered one.
        </p>

        <p className="mt-4 text-pretty text-lg leading-relaxed text-[#68717D]">
          It won&rsquo;t change how the debrief works &mdash; it will make it more specific. AfterFlight isn&rsquo;t
          becoming a flight tracker; the flight is the input, and the next lesson is still the point.
        </p>

        <p className="mt-6 border-t border-black/[0.08] pt-5 text-sm leading-relaxed text-[#8c97a2]">
          Not available yet, and not required to use AfterFlight.
        </p>
      </Reveal>
    </section>
  );
}
