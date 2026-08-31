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
    <section className="bg-[#f4f5f6] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1100px]">
        <SectionHead
          eyebrow="Two views of the same flight"
          headline="See where you and your instructor landed."
          body="You record how the flight felt to you before you see their debrief. When the two readings differ, that gap is usually the most useful thing in the lesson."
        />

        <div className="mx-auto mt-14 max-w-[860px]">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Reveal delay={100}>
              <View label="You felt" quote="Crosswind landings were going pretty well." accent="border-t-[#2c6c93]" />
            </Reveal>
            <Reveal delay={180}>
              <View
                label="Your instructor saw"
                quote="Centerline control improved, but correction still needs more consistency through touchdown."
                accent="border-t-brand"
              />
            </Reveal>
          </div>

          <Reveal delay={260} className="mt-5">
            <div className="rounded-[24px] bg-[#142033] px-7 py-7 sm:px-9">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Takeaway</p>
              <p className="font-display mt-2.5 text-balance text-xl font-bold leading-snug text-white sm:text-2xl">
                You&rsquo;re making progress, but consistency is still the thing to work on before the next flight.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function View({ label, quote, accent }: { label: string; quote: string; accent: string }) {
  return (
    <figure className={`h-full rounded-[24px] border-t-[3px] bg-white px-7 py-7 ${accent}`}>
      <figcaption className="text-xs font-bold uppercase tracking-[0.14em] text-[#68717D]">{label}</figcaption>
      <blockquote className="mt-3 text-pretty text-lg italic leading-relaxed text-[#101727]">
        &ldquo;{quote}&rdquo;
      </blockquote>
    </figure>
  );
}
