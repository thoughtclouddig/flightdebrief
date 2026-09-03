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
    alt: "A student pilot working through study notes at a table beside the aircraft, with the plan open on a tablet",
    title: "Recommended Study",
    copy: "Chosen for what you're working on now.",
  },
  {
    src: "/images/capabilities/chair-flying.avif",
    alt: "A student pilot rehearsing a maneuver at a desk in front of a full-size cockpit panel",
    title: "Chair Flying",
    copy: "Rehearse the maneuver before you fly it again.",
  },
  {
    src: "/images/capabilities/instructor-continuity.avif",
    alt: "An instructor and student going over the training record together on a tablet beside the aircraft",
    title: "Instructor Continuity",
    copy: "Your history carries forward when CFIs change.",
  },
  {
    src: "/images/capabilities/acs-readiness.avif",
    alt: "A student pilot reviewing ACS readiness on a tablet at a desk, with checkride preparation notes behind",
    title: "ACS Readiness",
    copy: "See your progress toward checkride standards.",
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
export function CapabilityCards({
  className,
  columns = 4,
}: {
  className?: string;
  /**
   * Four across needs the full-width section. Inside a stage band the content
   * column is 870px, which gives each of four cards about 197px -- narrower
   * than the "Instructor Continuity" label needs and too tight for the
   * illustration above it. Two across gives them ~425px each.
   */
  columns?: 2 | 4;
}) {
  return (
        <Reveal delay={150} className={cn(className)}>
          {/* Four across at xl, not lg. "Instructor Continuity" needs 249px and a
            quarter of this container at a 1024px viewport is about 214px --
            less once card padding is taken out -- so below xl it goes two-up
            rather than wrapping the label. */}
          <dl className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2", columns === 4 && "xl:grid-cols-4")}>
            {CAPABILITIES.map((c) => (
              <div
                key={c.title}
                className="flex flex-col overflow-hidden rounded-2xl border border-[#101727]/10 bg-white"
              >
                {/* Photographs now, not illustrations on a tinted panel. A
                    112px drawing needed a sunken band to stop it floating; a
                    16:9 photograph is its own anchor and fills the card's head
                    the way the perception-gap cards do.
                    
                    fill + object-cover rather than width/height, because the
                    card is 423px wide two-up in a stage band and about 270px
                    four-up in the full-width section, and the source is one
                    900px asset serving both. */}
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src={c.src}
                    alt={c.alt}
                    fill
                    className="object-cover"
                    /* sizes has to follow the column count, not guess it.
                       A single hint written for the four-up section made the
                       browser fetch the 280px candidate for a card that is
                       421px wide two-up in the stage band -- a visibly soft
                       upscale. Four-up the card is ~277px in an 1180px
                       container; two-up it is ~430px. */
                    sizes={
                      columns === 4
                        ? "(min-width: 1280px) 280px, (min-width: 640px) 45vw, 100vw"
                        : "(min-width: 1024px) 440px, (min-width: 640px) 45vw, 100vw"
                    }
                  />
                </div>
                <div className="px-5 pb-6 pt-5">
                  {/* 16px. The note this replaces said "Instructor Continuity"
                      measures 249px at 15px and pinned the label to 13px on
                      that basis; re-measured in the browser it is 206px at
                      15px and 226px at 16px with 0.04em. The binding case is
                      still the four-up section -- a quarter of an 1180px
                      container is 277px, less 40px of padding, leaves 237px --
                      so 16px clears it by 11px. Two-up in the stage band there
                      is 381px and no constraint at all. Re-measure before
                      adding a longer capability name. */}
                  <dt className="font-display text-[16px] font-bold uppercase tracking-[0.04em] text-[#101727]">
                    {c.title}
                  </dt>
                  {/* text-pretty, not text-balance. CLAUDE.md is explicit that
                      balance is for headings: it shortens the measure to even
                      the lines, which on a two-line card sentence produces the
                      odd early break instead of letting it fill the card. And
                      17px rather than 15 -- this is body copy on a 421px card,
                      not a caption. */}
                  <dd className="text-pretty mt-2 text-[17px] leading-relaxed text-[#414B57]">{c.copy}</dd>
                </div>
              </div>
            ))}
          </dl>
        </Reveal>
  );
}
