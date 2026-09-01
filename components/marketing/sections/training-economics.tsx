import { Clock, PiggyBank, TrendingUp } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const BENEFITS = [
  { icon: PiggyBank, title: "Save money", copy: "Avoid repeat lessons and extra flight time." },
  { icon: Clock, title: "Save time", copy: "Spend less time relearning and more time progressing." },
  { icon: TrendingUp, title: "Improve faster", copy: "Show up prepared and make every flight count.", accent: true },
];

/**
 * The economic stakes of broken continuity, and the arithmetic behind them.
 *
 * The calculator was removed from this section on 2026-09-01 and the
 * component kept (components/marketing/training-cost-calculator.tsx). The
 * argument here is one sentence -- flight time is too expensive to spend
 * catching up -- and an interactive ROI widget is a lot of page length to
 * make a point that lands without it. Reinstating it is a product decision,
 * not a cleanup.
 *
 * The historical note below is kept because it records why the section reads
 * the way it does.
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
    <section id="training-economics" className="bg-white px-6 py-28 sm:py-36">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid grid-cols-1 items-center gap-x-16 gap-y-14 lg:grid-cols-2">
          <Reveal>
            <p className="text-balance text-xs font-bold uppercase tracking-[0.16em] text-brand">Make Every Training Hour Count</p>
            <h2 className="font-display mt-3 text-balance text-3xl font-bold leading-tight text-[#101727] sm:text-4xl">
              Flight training is too expensive to keep{" "}
              <span className="text-brand">relearning the same lesson.</span>
            </h2>
            <p className="mt-5 text-pretty text-lg text-[#68717D]">
              When feedback gets lost between flights, students can spend expensive airplane time rebuilding
              context instead of progressing. A 1.5-hour training flight can cost hundreds of dollars, and the
              hour you spend re-covering last lesson is an hour you paid for twice.
            </p>
            <p className="mt-4 text-pretty text-lg text-[#68717D]">
              <strong className="text-[#101727]">AfterFlight carries your instructor&rsquo;s feedback forward</strong>,
              so the next lesson starts where the last one finished.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="flex flex-col divide-y divide-black/[0.08]">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex items-start gap-5 py-8">
                  <span
                    className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
                      b.accent ? "bg-brand text-white" : "bg-[#f4f5f6] text-[#101727]"
                    }`}
                  >
                    <b.icon className="size-6" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-display text-xl font-bold text-[#101727]">{b.title}</p>
                    <p className="mt-1 text-pretty text-base text-[#68717D]">{b.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={150} className="mx-auto mt-24 max-w-[1000px]">
          <div className="rounded-[28px] bg-[#f4f5f6] px-6 py-10 sm:px-10 sm:py-12">
            <div className="mx-auto max-w-2xl text-center">
              <h3 className="font-display text-balance text-3xl font-bold leading-tight text-[#101727] sm:text-4xl">
                What does one repeated lesson cost you?
              </h3>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-[#68717D]">
                The most expensive place to learn something twice is in the airplane.
              </p>
            </div>

            <div className="mt-9">
            </div>

            {/* Part of the output, not fine print under it. The figure above is
                the student's own arithmetic, and saying so is what keeps it
                from reading as a projected saving. */}
            <p className="mx-auto mt-7 max-w-xl text-balance text-center text-sm leading-relaxed text-[#68717D]">
              This calculator is illustrative and uses the numbers you enter. AfterFlight does not guarantee a
              specific reduction in training time or cost.
            </p>
          </div>
        </Reveal>
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
