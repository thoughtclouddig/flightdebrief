import { Reveal } from "@/components/marketing/reveal";

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

/**
 * Purpose-built marks, not stock glyphs.
 *
 * Lucide has nothing for "rehearse the procedure in your head" or "progress
 * toward a published standard", and reaching for a generic book or checkmark
 * would say less than the words underneath already do. These are four line
 * drawings on one system: 24px box, 1.5 stroke, round caps, currentColor, and
 * one brand-orange accent each marking the thing that matters -- the point in
 * the sequence, the highlighted passage, the changed instructor, the standard
 * being reached.
 */
const ICON = "size-6 shrink-0";
const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Highlighted passage: lines of text with one picked out. */
function StudyMark() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} aria-hidden {...S}>
      <path d="M4 5h16M4 9h16M4 17h10" />
      <path d="M4 13h9" className="text-brand" stroke="currentColor" strokeWidth={3} />
    </svg>
  );
}

/** Cockpit flow: a hand path stepping through control positions. */
function ChairFlyMark() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} aria-hidden {...S}>
      <path d="M4 18c2.5 0 3-4 5.5-4s3 4 5.5 4 3-4 5-4" />
      <circle cx="4" cy="18" r="1.4" />
      <circle cx="9.5" cy="14" r="1.4" />
      <circle cx="15" cy="18" r="1.4" className="text-brand" stroke="currentColor" />
      <path d="M12 4v4" />
    </svg>
  );
}

/** Continuity: a thread carried across a change of instructor. */
function ContinuityMark() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} aria-hidden {...S}>
      <circle cx="6" cy="8" r="2.6" />
      <circle cx="18" cy="8" r="2.6" className="text-brand" stroke="currentColor" />
      <path d="M3 20c0-2.4 1.6-4 3-4" />
      <path d="M21 20c0-2.4-1.6-4-3-4" />
      <path d="M8.6 8h6.8" strokeDasharray="2 2.4" />
    </svg>
  );
}

/** ACS: stepped tasks rising toward a standard. */
function AcsMark() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} aria-hidden {...S}>
      <path d="M3 20h18" />
      <path d="M6 20v-4M11 20v-8M16 20v-5" />
      <path d="M16 15V6h5" className="text-brand" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}

const CAPABILITIES = [
  {
    Mark: StudyMark,
    title: "Recommended Study",
    copy: "Review material relevant to what you're working on now.",
  },
  {
    Mark: ChairFlyMark,
    title: "Chair Flying",
    copy: "Rehearse the maneuver before you're back in the airplane.",
  },
  {
    Mark: ContinuityMark,
    title: "Instructor Continuity",
    copy: "Your history and priorities carry forward when instructors change.",
  },
  {
    Mark: AcsMark,
    title: "ACS Readiness",
    copy: "See how your training is building toward checkride standards.",
  },
] as const;

export function Capabilities() {
  return (
    <section className="bg-white px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-[1100px]">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-balance text-lg font-bold uppercase tracking-[0.16em] text-brand sm:text-xl">
            Between your flights
          </p>
          <p className="font-display mt-3 text-balance text-3xl font-bold leading-[1.05] text-[#101727] sm:text-4xl">
            Your next flight gets easier before you fly it.
          </p>
        </Reveal>

        <Reveal delay={150} className="mt-12">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((c) => (
              <div key={c.title} className="border-t border-[#101727]/12 pt-5">
                <c.Mark />
                <dt className="font-display mt-3 text-[15px] font-bold uppercase tracking-wide text-[#101727]">
                  {c.title}
                </dt>
                <dd className="text-balance mt-1.5 text-[15px] leading-relaxed text-[#4b545d]">{c.copy}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
