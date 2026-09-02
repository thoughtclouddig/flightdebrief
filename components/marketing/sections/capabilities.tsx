import Image from "next/image";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";

/**
 * The product-depth beat, and the whole point is that it stays small.
 *
 * Simplifying the homepage created a second problem: with four sections cut
 * and no feature tour left, a visitor can finish the page without realizing
 * how much runs between their flights. This answers that in one scan.
 *
 * FOUR items, not eight. Vector and Debrief Replay were on the original list
 * and are deliberately absent -- both still have full sections above this one,
 * so listing them here would re-add length to say something the page already
 * said. What is here is what the page would otherwise never mention: Chair
 * Flying appears nowhere else, ACS readiness nowhere else, and Instructor
 * Continuity left the page entirely with ForCfis and WhoItsFor.
 *
 * The treatment is BrandMoment's rule-and-label list rather than cards, for
 * the reason recorded there: as cards these become four more objects
 * competing with the sections around them, which is the bloat this pass
 * exists to remove. A hairline and a label is enough structure. No numerals
 * here though -- these are a set, not a sequence, and numbering them would
 * imply an order the student is supposed to follow.
 *
 * The captions balance rather than using text-pretty. They are one-line
 * labels in a narrow four-column grid, not body copy, so evening the lines is
 * right here even though the opposite is true of paragraphs elsewhere on the
 * page -- "Review material relevant to what you're working on now." was
 * ending on "on now." at 16% of the measure.
 */

const CAPABILITIES = [
  {
    src: "/images/capabilities/recommended-study.avif",
    title: "Recommended Study",
    copy: "Review material relevant to what you're working on now.",
  },
  {
    src: "/images/capabilities/chair-flying.avif",
    title: "Chair Flying",
    copy: "Rehearse the maneuver before you're back in the airplane.",
  },
  {
    src: "/images/capabilities/instructor-continuity.avif",
    title: "Instructor Continuity",
    copy: "Your history and priorities carry forward when instructors change.",
  },
  {
    src: "/images/capabilities/acs-readiness.avif",
    title: "ACS Readiness",
    copy: "See how your training is building toward checkride standards.",
  },
] as const;

export function Capabilities() {
  return (
    <section id="between-flights" className="bg-white px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-[1180px]">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-balance text-lg font-bold uppercase tracking-[0.16em] text-brand sm:text-xl">
            Between your flights
          </p>
          <p className="font-display mt-3 text-balance text-4xl font-bold leading-[1.05] text-[#101727] sm:text-5xl">
            Your next flight gets easier before you fly it.
          </p>
        </Reveal>

        <CapabilityCards className="mt-12" />
      </div>
    </section>
  );
}

/**
 * The four cards, separated from the section wrapper, so the Next Flight
 * stage can render them under its own module head. Exported rather than
 * duplicated -- one definition of the capability set, not two.
 */
export function CapabilityCards({ className }: { className?: string }) {
  return (
        <Reveal delay={150} className={cn(className)}>
          {/* Four across at xl, not lg. "Instructor Continuity" needs 249px and a
            quarter of this container at a 1024px viewport is about 214px --
            less once card padding is taken out -- so below xl it goes two-up
            rather than wrapping the label. */}
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {CAPABILITIES.map((c) => (
              <div
                key={c.title}
                className="flex flex-col overflow-hidden rounded-2xl border border-[#101727]/10 bg-white"
              >
                {/* The illustration gets its own tinted panel rather than
                    sitting on the page. On white it floated with nothing to
                    hold it; a sunken band gives each card a consistent visual
                    anchor and makes four different drawings read as one set. */}
                <div className="flex items-center justify-center bg-[#f4f5f6] py-7">
                  <Image src={c.src} alt="" width={112} height={112} className="size-[112px]" unoptimized />
                </div>
                <div className="px-5 pb-6 pt-5">
                  {/* 13px, and the card's own padding is why. "Instructor Continuity"
                      measures 249px at 15px; a quarter of this container at xl
                      is 277px, less 40px of padding, which leaves 237px. The
                      label has to fit the card, not the column. */}
                  <dt className="font-display text-[13px] font-bold uppercase tracking-wide text-[#101727]">
                    {c.title}
                  </dt>
                  <dd className="text-balance mt-1.5 text-[15px] leading-relaxed text-[#4b545d]">{c.copy}</dd>
                </div>
              </div>
            ))}
          </dl>
        </Reveal>
  );
}
