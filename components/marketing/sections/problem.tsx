import { Reveal } from "@/components/marketing/reveal";
import { DEMO_TRANSCRIPT_FRAGMENTS } from "@/lib/marketing/demo-data";

export function Problem() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
      <Reveal>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">After every lesson</p>
        <h2 className="font-display mt-4 text-balance text-4xl font-extrabold uppercase leading-[1.02] text-foreground sm:text-5xl">
          The most valuable ten minutes of a lesson disappear.
        </h2>
      </Reveal>

      <Reveal delay={100}>
        <p className="mx-auto mt-6 max-w-md text-pretty text-[17px] leading-relaxed text-foreground-soft">
          After shutdown, the student and instructor talk through the flight — what went well, what didn&rsquo;t, what
          to work on next time. Then the lesson ends.
        </p>
      </Reveal>

      <Reveal delay={200}>
        <p className="font-display mt-10 text-balance text-2xl font-bold italic text-foreground-soft sm:text-3xl">
          &ldquo;Where did we leave off?&rdquo;
        </p>
      </Reveal>

      <Reveal delay={300}>
        <p className="font-display mt-6 text-2xl font-extrabold uppercase text-brand">FlightBrief remembers.</p>
      </Reveal>

      <div className="mx-auto mt-14 flex max-w-lg flex-wrap justify-center gap-2">
        {DEMO_TRANSCRIPT_FRAGMENTS.map((fragment, i) => (
          <Reveal key={fragment} delay={400 + i * 120}>
            <span className="inline-block rounded-md border border-hairline bg-surface px-3 py-1.5 text-sm text-foreground-soft">
              &ldquo;{fragment}&rdquo;
            </span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
