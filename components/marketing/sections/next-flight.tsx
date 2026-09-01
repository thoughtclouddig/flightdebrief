import { NextFlightCard } from "@/components/marketing/next-flight-card";
import { SectionHead } from "@/components/marketing/section-head";

/**
 * Next Flight, shown as the card the student actually gets.
 *
 * The previous version of this beat was two lifestyle photographs and the
 * sentence "know what to work on" -- a claim with nothing behind it. This
 * shows the artifact, because the artifact is the product: four short blocks
 * built from the flight that just happened, not a generic checklist. The card
 * assembles itself on scroll (see NextFlightCard) so the derivation the copy
 * asserts is something you watch rather than something you're told.
 */
export function NextFlight() {
  return (
    <section className="bg-[#f4f5f6] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1100px]">
        <SectionHead
          eyebrow="Next flight"
          headline="Your next flight starts where your last one left off."
          body="Instead of showing up trying to remember where the last lesson ended, you arrive knowing what to focus on. Built from the flight you just flew — not from a syllabus template."
        />
        <NextFlightCard />
      </div>
    </section>
  );
}
