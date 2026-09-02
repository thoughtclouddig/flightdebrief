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
 * toward a published standard", and a generic book or checkmark would say less
 * than the words underneath already do.
 *
 * Drawn twice. The first pass was 24px at 1.5 stroke and read as faint
 * scratches at homepage size -- delicate is the opposite of what an aviation
 * training product should look like. These are 32px at 2.25, which is heavy
 * enough to register instantly, with silhouettes simple enough to survive it.
 *
 * One system: 24 viewBox, round caps, currentColor for the structure, and
 * exactly one brand-orange element per mark carrying the meaning -- the step
 * being rehearsed, the highlighted passage, the thread that survives, the
 * standard being reached.
 */
const ICON = "size-8 shrink-0 text-[#101727]";
const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.25,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Study: a page of text with one line picked out as the relevant one. */
function StudyMark() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} aria-hidden {...S}>
      <path d="M5 3.5h14v17H5z" />
      <path d="M8.5 8h7M8.5 16h4" />
      <path d="M8.5 12h7" stroke="var(--color-brand, #f07621)" strokeWidth={3.25} />
    </svg>
  );
}

/**
 * Chair flying: a three-step procedure with a loop back to the top.
 *
 * The first attempt was a wandering line with dots, which read as "flow" or
 * "thinking" rather than rehearsal. A numbered sequence you run again is the
 * actual idea, and the orange marks the step being worked.
 */
function ChairFlyMark() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} aria-hidden {...S}>
      <path d="M10 5.5h9M10 12h9M10 18.5h9" />
      <circle cx="5.5" cy="5.5" r="1.6" />
      <circle cx="5.5" cy="18.5" r="1.6" />
      <circle cx="5.5" cy="12" r="2.1" fill="var(--color-brand, #f07621)" stroke="var(--color-brand, #f07621)" />
    </svg>
  );
}

/** Continuity: the thread that survives a change of instructor. */
function ContinuityMark() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} aria-hidden {...S}>
      <circle cx="6" cy="7" r="2.8" />
      <circle cx="18" cy="7" r="2.8" />
      <path d="M4 20c0-2.8 2-4.6 4-4.6M20 20c0-2.8-2-4.6-4-4.6" />
      <path d="M6 12.5h12" stroke="var(--color-brand, #f07621)" strokeWidth={3.25} />
    </svg>
  );
}

/** ACS: tasks stepping up toward the published standard. */
function AcsMark() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} aria-hidden {...S}>
      <path d="M3.5 20.5h17" />
      <path d="M7 20.5v-5M12 20.5v-9" />
      <path d="M17 20.5V7h4" stroke="var(--color-brand, #f07621)" strokeWidth={3.25} />
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
              <div key={c.title} className="border-t-2 border-[#101727]/15 pt-5">
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
