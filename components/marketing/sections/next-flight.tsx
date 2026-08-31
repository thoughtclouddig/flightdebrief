import { Reveal } from "@/components/marketing/reveal";
import { SectionHead } from "@/components/marketing/section-head";

/**
 * Next Flight, shown as the card the student actually gets.
 *
 * The previous version of this beat was two lifestyle photographs and the
 * sentence "know what to work on" -- a claim with nothing behind it. This
 * shows the artifact, because the artifact is the product: four short blocks
 * built from the flight that just happened, not a generic checklist.
 */
const FOCUS = ["Stabilized approach speed", "Crosswind correction through touchdown"] as const;

const TRAIN = ["3-minute review", "Quick knowledge check", "Chair-flying prompt"] as const;

const REMEMBER = ["Get configured earlier", "Hold correction through touchdown", "Don't chase the flare"] as const;

export function NextFlight() {
  return (
    <section className="bg-[#f4f5f6] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1100px]">
        <SectionHead
          eyebrow="Next flight"
          headline="Know exactly what to work on before you fly again."
          body="AfterFlight builds your next-flight prep from the flight you just flew — not from a syllabus template."
        />

        <Reveal delay={120} className="mx-auto mt-14 max-w-[720px]">
          <div className="overflow-hidden rounded-[28px] border border-black/[0.06] bg-white shadow-[0_24px_50px_-24px_rgba(16,23,39,0.28)]">
            <div className="bg-[#142033] px-7 py-6 sm:px-9">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Your next flight</p>
              <p className="font-display mt-1.5 text-2xl font-bold text-white sm:text-3xl">Thursday · Crosswind + Short Field</p>
              <p className="mt-1 text-base text-[#9da7b8]">With Jake · built from Tuesday&rsquo;s debrief</p>
            </div>

            <div className="flex flex-col gap-8 px-7 py-8 sm:px-9 sm:py-10">
              <Block title="What matters most">
                <ol className="flex flex-col gap-3">
                  {FOCUS.map((f, i) => (
                    <li key={f} className="flex items-start gap-3.5">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#f4f5f6] text-sm font-bold tabular-nums text-[#68717D]">
                        {i + 1}
                      </span>
                      <span className="text-lg leading-snug text-[#101727]">{f}</span>
                    </li>
                  ))}
                </ol>
              </Block>

              <Block title="What your instructor wants continued">
                <blockquote className="border-l-2 border-brand/60 pl-4">
                  <p className="text-pretty text-lg italic leading-relaxed text-[#4b545d]">
                    &ldquo;Maintain 65 KIAS through short final.&rdquo;
                  </p>
                  <footer className="mt-1 text-sm font-medium text-[#68717D]">Jake, after Tuesday&rsquo;s flight</footer>
                </blockquote>
              </Block>

              <Block title="Train with Vector">
                <ul className="flex flex-wrap gap-2.5">
                  {TRAIN.map((t) => (
                    <li
                      key={t}
                      className="rounded-full border border-[#e3e5e8] bg-white px-4 py-2 text-base font-medium text-[#101727]"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </Block>

              <Block title="Remember in the cockpit">
                <ul className="flex flex-col gap-2.5">
                  {REMEMBER.map((r) => (
                    <li key={r} className="flex items-start gap-3 text-lg leading-snug text-[#101727]">
                      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                      {r}
                    </li>
                  ))}
                </ul>
              </Block>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#68717D]">{title}</h3>
      <div className="mt-3.5">{children}</div>
    </div>
  );
}
