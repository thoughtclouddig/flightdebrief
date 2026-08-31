import { Reveal } from "@/components/marketing/reveal";
import { SectionHead } from "@/components/marketing/section-head";
import { VectorDemo } from "@/components/marketing/vector-demo";

/**
 * Vector's introduction.
 *
 * The whole section exists to make one distinction land: Vector is not a
 * chat box you have to explain your training to. It opens already knowing it.
 * That is why the prompts below are shown as things Vector can already answer
 * rather than as an empty input with a blinking cursor -- an empty box is
 * precisely the generic-assistant experience this is not.
 */
const KNOWS = [
  "Your debriefs",
  "Your instructor's feedback",
  "Your weak areas",
  "What keeps recurring",
  "Where you and your CFI differ",
  "Your next flight's focus",
] as const;

export function VectorSection() {
  return (
    <section id="vector" className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1100px]">
        <SectionHead
          eyebrow="Meet Vector"
          headline={
            <>
              Your AI flight trainer <span className="text-brand">between flights.</span>
            </>
          }
          body="Vector already knows your debriefs, your instructor's feedback, your weak areas, what keeps recurring, and what you're working on next — so you never start from scratch with a generic assistant."
        />

        <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-16">
          {/* Real product surface, and it plays: the point of Vector is what
              comes back, which a list of example prompts cannot show. */}
          <Reveal delay={100}>
            <VectorDemo />
          </Reveal>

          <Reveal delay={200} className="lg:pt-4">
            <p className="font-display text-balance text-2xl font-bold leading-tight text-[#101727] sm:text-3xl">
              It opens already knowing what you flew.
            </p>
            <ul className="mt-7 grid grid-cols-1 gap-x-8 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-1">
              {KNOWS.map((k) => (
                <li key={k} className="flex items-start gap-3 text-base text-[#101727]">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  {k}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-pretty text-base leading-relaxed text-[#68717D]">
              Vector starts with your actual training record, and reaches for the FAA Airplane Flying Handbook, the
              ACS and your POH when the answer needs a source.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
