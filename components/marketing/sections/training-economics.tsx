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
      <div className="mx-auto max-w-[1320px]">
        {/* Equal columns. A first attempt gave the calculator 1.15fr against
            0.85fr, which cramped the headline into four lines and made the
            calculator read as an oversized slab rather than a denser one. The
            weight problem was never the column width -- it was the double
            container below.

            items-start, not items-center. Centring left the shorter column
            floating against the middle of the calculator card, so the headline
            began about 110px below the card's top edge and the two sides read
            as unrelated blocks rather than a pair.

            The headline stays at text-4xl. Pushing it to 2.6rem to "match" the
            calculator's weight made it wrap to three lines in a half-width
            column, which reads worse than the size gain is worth. */}
        <div className="grid grid-cols-1 items-start gap-x-14 gap-y-12 lg:grid-cols-2">
          <Reveal>
            <p className="text-balance text-xs font-bold uppercase tracking-[0.16em] text-brand">Make Every Training Hour Count</p>
            <h2 className="font-display mt-3 text-balance text-3xl font-bold leading-[1.1] text-[#101727] sm:text-4xl">
              Flight training is too expensive to keep{" "}
              <span className="text-brand">relearning the same lesson.</span>
            </h2>
            <p className="mt-5 text-pretty text-lg text-[#68717D]">
              When feedback gets lost between flights, students can spend expensive airplane time rebuilding
              context instead of progressing. A 1.5-hour training flight can cost hundreds of dollars, and the
              hour you spend re-covering last lesson is an hour you paid for twice.
            </p>
          </Reveal>

          <Reveal delay={100}>
            {/* No gray wrapper. The calculator already renders its own white
                card, so boxing it again produced a card inside a box with two
                sets of padding -- most of the column's height was margin. */}
            <div>
              <TrainingCostCalculator />
              {/* Part of the output, not fine print under it. The figure above
                  is the student's own arithmetic, and saying so is what keeps
                  it from reading as a projected saving. */}
              <p className="mx-auto mt-7 max-w-md text-balance text-center text-sm leading-relaxed text-[#68717D]">
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
