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
          headline="Know exactly what to work on before you fly again."
          body="AfterFlight builds your next-flight prep from the flight you just flew — not from a syllabus template."
        />
        <NextFlightCard />
      </div>
    </section>
  );
}
