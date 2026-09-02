import { Reveal } from "@/components/marketing/reveal";
import { TrainingCostCalculator } from "@/components/marketing/training-cost-calculator";

/**
 * The economic stakes of broken continuity, and the arithmetic behind them.
 *
 * ONE argument, made once in words and once in the student's own numbers.
 * This section used to make it four times: a headline and two paragraphs, then
 * three benefit rows (Save money / Save time / Improve faster), then the
 * calculator under its own heading 24 units below, then the closing panel. The
 * benefit rows were the weakest of the four -- generic and unfalsifiable next
 * to a live figure built from the reader's own rate -- so they are gone, and
 * the calculator moved into the space they occupied. The second paragraph went
 * with them because it restated the first.
 *
 * The calculator is now the right-hand column rather than a fourth beat, which
 * is the point: it is the only part of this argument the reader can check.
 *
 * The calculator is the reason this section exists in its current form. The
 * cost of losing the thread is the most persuasive thing about this product
 * and also the easiest to overclaim: the honest version multiplies the
 * student's own rate by the student's own estimate and stops there. It does
 * not net out a saving, because AfterFlight does not know how many of those
 * hours it would have prevented, and a number that pretends otherwise is the
 * kind of claim a chief instructor checks once and never trusts again.
 */
export function TrainingEconomics() {
  return (
    <>
    <section id="training-economics" className="bg-white px-6 py-24 sm:py-32">
      {/* 1180, not 1320. At 1320 this was the widest container on the page by
          140px and the copy ran almost to the window edge at common laptop
          widths, so the section read as unbounded next to everything above it.
          The halves are ~562px here, which the calculator is comfortable in --
          the width that actually breaks it is a stage band's 870px column,
          which is why it is not in one. */}
      <div className="mx-auto max-w-[1180px]">
        {/* One column. Side by side, the headline had half the width and the
            calculator read as a slab bolted to it; the calculator is now the
            full measure and horizontal, which is what it wanted all along. */}
        <div>
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.16em] text-brand">Every training hour counts</p>
            <h2 className="font-display mt-3 text-balance text-3xl font-bold leading-[1.1] text-[#101727] sm:text-4xl">
              Flight training is too expensive to keep{" "}
              <span className="text-brand">relearning the same lesson.</span>
            </h2>
            <p className="mt-5 text-pretty text-lg text-[#414B57]">
              When the last lesson gets forgotten, you spend the first half of the next one catching up. That is an
              hour of airplane you paid for twice.
            </p>
          </Reveal>

          <Reveal delay={100} className="mt-12">
            {/* No gray wrapper. The calculator already renders its own white
                card, so boxing it again produced a card inside a box with two
                sets of padding -- most of the column's height was margin. */}
            <div>
              <TrainingCostCalculator />
              {/* Part of the output, not fine print under it. The figure above
                  is the student's own arithmetic, and saying so is what keeps
                  it from reading as a projected saving. */}
              <p className="mx-auto mt-7 max-w-md text-balance text-center text-sm leading-relaxed text-[#414B57]">
                This calculator is illustrative and uses the numbers you enter. AfterFlight does not guarantee a
                specific reduction in training time or cost.
              </p>
            </div>
          </Reveal>
        </div>

      </div>
    </section>

    <section className="relative overflow-hidden bg-[#101727] px-6 py-20 text-center sm:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#171f33_0%,_#0c1220_75%)]" />
      <Reveal className="relative mx-auto max-w-5xl">
        {/*
          * The forced break only applies where both halves actually fit.
          *
          * "One less repeat lesson can pay for" measures 961px at 48px against
          * what was an 896px container, so it wrapped and left "for" alone on
          * a line. `whitespace-nowrap` could not save it -- nowrap does not
          * shrink text, it just overflows or, once the browser breaks anyway,
          * strands the tail.
          *
          * From lg the container is 1024px and the size is capped so the long
          * line stays inside it. Below lg the break is dropped entirely and
          * text-pretty is left to split the sentence, which it does evenly --
          * a balanced wrap cannot produce the orphan a hand-placed break did.
          */}
        <p className="font-display text-balance text-3xl font-bold leading-snug text-white sm:text-4xl lg:text-[clamp(2.5rem,4.2vw,3rem)]">
          One less repeat lesson can pay for
          <br className="hidden lg:block" />{" "}
          <span className="text-brand">an entire year of AfterFlight.</span>
        </p>
      </Reveal>
    </section>
    </>
  );
}
