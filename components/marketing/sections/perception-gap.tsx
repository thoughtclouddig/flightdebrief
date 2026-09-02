import { PlaneTakeoff } from "lucide-react";
import Image from "next/image";
import { Reveal } from "@/components/marketing/reveal";
import { SectionHead } from "@/components/marketing/section-head";

/**
 * The perception gap, framed as teaching rather than scoring.
 *
 * The framing rules are load-bearing, not tone preferences. No disagreement
 * score, no right-and-wrong, no "overconfident student", no "the instructor
 * failed to communicate". Both readings are treated as honest and partial,
 * and the takeaway points forward at the next flight -- which is the only
 * thing either of them can still change.
 */
export function PerceptionGap() {
  return (
    <section id="debrief" className="bg-[#f4f5f6] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1100px]">
        <SectionHead
          eyebrow="Two views of the same flight"
          headline="See where you and your instructor landed."
          body="You record how the flight felt to you before you see their debrief. When the two readings differ, that gap is usually the most useful thing in the lesson."
        />

        <div className="mx-auto mt-14 max-w-[860px]">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Reveal delay={100}>
              <View
                label="You felt"
                quote="Crosswind landings were going pretty well."
                accent="border-t-[#2c6c93]"
                src="/images/marketing/cockpit-approach.webp"
                alt="A student pilot's view over the panel on final approach"
              />
            </Reveal>
            <Reveal delay={180}>
              <View
                label="Your instructor saw"
                quote="Centerline control improved, but correction still needs more consistency through touchdown."
                accent="border-t-brand"
                src="/images/marketing/preflight-cfi-student.webp"
                alt="A flight instructor and student going over the flight together beside the aircraft"
              />
            </Reveal>
          </div>

          <Reveal delay={260} className="mt-5">
            {/*
             * Two columns, because one was leaving half the card empty.
             *
             * The takeaway ran full width as a single sentence and the right
             * side of a 1100px card sat unused. Splitting it gives the
             * sentence a sensible measure and lets the right column carry what
             * makes this feel generated for one student rather than written
             * for a brochure: which objective it came from, and what it turns
             * into on the next flight. Nothing here is filler -- both are
             * things the product actually produces from a debrief.
             */}
            <div className="grid gap-7 rounded-2xl bg-[#142033] px-7 py-7 sm:px-9 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Takeaway</p>
                <p className="font-display mt-2.5 text-balance text-xl font-bold leading-snug text-white sm:text-2xl">
                  You&rsquo;re making progress, but consistency is still the thing to work on before the next flight.
                </p>
              </div>

              <dl className="flex flex-col gap-4 border-t border-white/10 pt-6 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8c97a2]">From</dt>
                  <dd className="mt-1 text-pretty text-[15px] font-semibold text-white">
                    Crosswind Landings &middot; Aug 29 with Jake
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8c97a2]">Carries into</dt>
                  <dd className="mt-1 flex items-start gap-2.5 text-pretty text-[15px] text-[#dfe4ec]">
                    <PlaneTakeoff className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                    Hold the correction through touchdown
                  </dd>
                </div>
              </dl>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/**
 * Each side gets the view it actually had.
 *
 * As two identical text cards this section asserted "two views of the same
 * flight" and showed one thing twice, which is why it read as filler. The
 * images do the work the copy was doing alone: the student's card is the seat
 * they were in -- over the panel, on final, in the moment -- and the
 * instructor's is the two of them going over it from outside the airplane.
 * Subjective and observed, which is the entire point of the section.
 *
 * Deliberately scenes rather than portraits. A face beside a quotation mark
 * reads as a testimonial from a real named person, and these are illustrative
 * personas.
 */
function View({
  label,
  quote,
  accent,
  src,
  alt,
}: {
  label: string;
  quote: string;
  accent: string;
  src: string;
  alt: string;
}) {
  return (
    <figure className="flex h-full flex-col overflow-hidden rounded-2xl bg-white">
      <div className="relative aspect-[16/10] w-full">
        <Image src={src} alt={alt} fill className="object-cover" sizes="(min-width: 640px) 430px, 100vw" />
      </div>
      {/* The accent moves below the image so it still separates the two voices
          without a colored hairline floating above a photograph. */}
      <div className={`flex flex-1 flex-col border-t-[3px] px-7 py-7 ${accent}`}>
        <figcaption className="text-xs font-bold uppercase tracking-[0.14em] text-[#4E5A67]">{label}</figcaption>
        <blockquote className="mt-3 text-pretty text-lg italic leading-relaxed text-[#101727]">
          &ldquo;{quote}&rdquo;
        </blockquote>
      </div>
    </figure>
  );
}
