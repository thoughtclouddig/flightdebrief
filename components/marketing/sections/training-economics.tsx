import { Clock, PiggyBank, TrendingUp } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const BENEFITS = [
  { icon: PiggyBank, title: "Save money", copy: "Avoid repeat lessons and extra flight time." },
  { icon: Clock, title: "Save time", copy: "Spend less time relearning and more time progressing." },
  { icon: TrendingUp, title: "Improve faster", copy: "Show up prepared and make every flight count.", accent: true },
];

export function TrainingEconomics() {
  return (
    <>
    <section className="bg-white px-6 py-28 sm:py-36">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid grid-cols-1 items-center gap-x-16 gap-y-14 lg:grid-cols-2">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Make Every Training Hour Count</p>
            <h2 className="font-display mt-3 text-balance text-3xl font-bold leading-tight text-[#101727] sm:text-4xl">
              Flight training is expensive. <span className="text-brand">Don&rsquo;t waste the lesson.</span>
            </h2>
            <p className="mt-5 text-pretty text-lg text-[#68717D]">
              A 1.5-hour training flight can cost hundreds of dollars. If you forget what your
              instructor said, repeat the same mistake, or show up unprepared for the next lesson,
              that costs more than time.
            </p>
            <p className="mt-4 text-pretty text-lg text-[#68717D]">
              <strong className="text-[#101727]">AfterFlight helps you capture the lesson while it&rsquo;s fresh</strong>,
              remember what matters, and walk into your next flight knowing exactly what to work on.
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
      </div>
    </section>

    <section className="relative overflow-hidden bg-[#101727] px-6 py-20 text-center sm:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#171f33_0%,_#0c1220_75%)]" />
      <Reveal className="relative mx-auto max-w-4xl">
        <p className="font-display text-3xl font-bold leading-snug text-white sm:whitespace-nowrap sm:text-4xl lg:text-5xl">
          One less repeat lesson can pay for
          <br />
          <span className="text-brand">an entire year of AfterFlight.</span>
        </p>
      </Reveal>
    </section>
    </>
  );
}
