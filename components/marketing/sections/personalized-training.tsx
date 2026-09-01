import type { ReactNode } from "react";
import { Reveal } from "@/components/marketing/reveal";
import { SectionHead } from "@/components/marketing/section-head";

/**
 * Explain -> check -> rehearse, shown against one real weak area.
 *
 * Replaces the old "study" beat, which ended by pointing students at FAA
 * resources. Handing someone the Airplane Flying Handbook and a chapter
 * number is not training -- it's the same "work on landings" problem with a
 * citation attached. The FAA material is the grounding layer here, named at
 * the bottom, not the experience.
 *
 * The four stages are numbered and ruled apart because the first version set
 * them as small grey uppercase labels with only whitespace between: at a
 * glance the whole card read as one undifferentiated column, and the labels
 * were quieter than the body text they were introducing. A stage heading has
 * to outweigh its own content or it isn't a heading. The numbering is not
 * decoration either -- this genuinely is a sequence, and the point of the
 * section is that each stage is derived from the one above it.
 */
const STAGES = [
  {
    label: "What Jake said",
    body: (
      <blockquote className="border-l-[3px] border-brand pl-5 text-pretty text-lg italic leading-relaxed text-[#4b545d]">
        &ldquo;Centerline control improved, but correction is still being relaxed through touchdown.&rdquo;
      </blockquote>
    ),
  },
  {
    label: "What Vector explains",
    body: (
      <p className="text-pretty text-lg leading-relaxed text-[#101727]">
        Why control input needs to <em className="font-semibold not-italic">increase</em> as the airplane slows &mdash;
        the same aileron does less work at 55 knots than it did at 70.
      </p>
    ),
  },
  {
    label: "How you check it stuck",
    body: (
      <p className="text-pretty text-lg leading-relaxed text-[#101727]">
        Three questions drawn from <span className="font-semibold">your</span> flight, not a written-test bank.
      </p>
    ),
  },
  {
    label: "What you take to the airplane",
    body: (
      <p className="rounded-2xl bg-[#142033] px-6 py-5 text-lg font-medium leading-snug text-white">
        &ldquo;Aileron progressively into the wind through touchdown.&rdquo;
      </p>
    ),
  },
] as const;

export function PersonalizedTraining() {
  return (
    <section className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1100px]">
        <SectionHead
          eyebrow="Personalized training"
          headline={
            <>
              Don&rsquo;t just read about the problem. <span className="text-brand">Fix it.</span>
            </>
          }
          body="AfterFlight turns the weak areas from your actual flight into short training sessions, flight-specific questions, and cues you can carry into the cockpit next time."
        />

        <Reveal delay={120} className="mx-auto mt-14 max-w-[820px]">
          <div className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-[0_24px_50px_-28px_rgba(16,23,39,0.22)]">
            <div className="border-b border-black/[0.07] px-7 py-7 sm:px-10">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Crosswind landings</p>
              <p className="font-display mt-1.5 text-2xl font-bold leading-tight text-[#101727] sm:text-3xl">
                From one line in your debrief to something you can practice.
              </p>
            </div>

            <ol>
              {STAGES.map((stage, i) => (
                <Stage key={stage.label} n={i + 1} delay={i * 110} label={stage.label}>
                  {stage.body}
                </Stage>
              ))}
            </ol>

            {/* Sources named, and deliberately last. Grounding, not the product. */}
            <p className="bg-[#f4f5f6] px-7 py-5 text-sm text-[#68717D] sm:px-10">
              Grounded in the FAA Airplane Flying Handbook and the Airman Certification Standards.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/**
 * The stages arrive in sequence rather than together.
 *
 * The claim this card makes is that each stage is DERIVED from the one above
 * it -- the instructor's sentence becomes an explanation, the explanation
 * becomes a check, the check becomes a cue you take to the airplane. Revealed
 * as one block, that is something the reader is told. Revealed in order, at
 * roughly reading pace, it is something they watch happen.
 *
 * The Reveal sits inside the <li> rather than wrapping it, so the list stays a
 * list: an <ol> whose children are divs is no longer an ordered list to a
 * screen reader, and the numbering here is the meaning.
 */
function Stage({ n, label, delay, children }: { n: number; label: string; delay: number; children: ReactNode }) {
  return (
    <li className="border-b border-black/[0.07] last:border-b-0">
      <Reveal delay={delay} className="flex gap-5 px-7 py-8 sm:gap-6 sm:px-10 sm:py-9">
        <span className="font-display mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#142033] text-base font-extrabold tabular-nums text-white">
          {n}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl font-bold leading-snug text-[#101727]">{label}</h3>
          <div className="mt-3.5">{children}</div>
        </div>
      </Reveal>
    </li>
  );
}
