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
/**
 * Deliberately phrased as things about HOW THIS STUDENT FLIES, not as a
 * feature list of data sources. "Your debriefs" describes an input; "the
 * mistake you keep making in the flare" describes knowledge, and knowledge is
 * what separates this from a chat box that has to be told everything first.
 */
/**
 * Four, not six. Two of the originals restated their neighbors -- the habit
 * that shows up when the pattern gets busy is the same claim as which
 * corrections you relax and when, and what the instructor wants continued next
 * lesson is the next-flight section's job. A list long enough to skim is a
 * list nobody reads a single line of, and each of these four is a distinct
 * kind of knowledge: a behavior, a pattern across instructors, a gap in
 * self-perception, and something already proven.
 */
const KNOWS = [
  "Which corrections you relax, and when",
  "The weak area two instructors have now flagged",
  "Where your read of a flight differs from your CFI's",
  "What you have already proven you can do",
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
          body="Not a chatbot you have to brief first. Vector already knows how you fly — what your instructor flagged, what keeps coming back, what you've already proven — so the time between lessons goes at the thing actually holding you up."
        />

        <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-16">
          {/* Real product surface, and it plays: the point of Vector is what
              comes back, which a list of example prompts cannot show. */}
          <Reveal delay={100}>
            <VectorDemo />
          </Reveal>

          <Reveal delay={200} className="lg:pt-4">
            <p className="font-display text-balance text-2xl font-bold leading-tight text-[#101727] sm:text-3xl">
              Vector knows how you fly.
            </p>
            <p className="text-pretty mt-3 text-lg leading-relaxed text-[#68717D]">
              Not generic questions about airplanes in general &mdash; the specific things your own flying keeps
              doing, and the ones your instructor has stopped having to mention.
            </p>
            <ul className="mt-7 grid grid-cols-1 gap-x-8 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-1">
              {KNOWS.map((k) => (
                <li key={k} className="flex items-start gap-3 text-base text-[#101727]">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  {k}
                </li>
              ))}
            </ul>
            {/* The economic claim, stated in the student's terms: hours are the
                currency of flight training, and a lesson spent relearning
                something is an hour they paid for twice. */}
            <p className="mt-8 text-pretty text-lg leading-relaxed text-[#101727]">
              That&rsquo;s the difference between studying and training. You stop spending lessons relearning what
              you already covered, and get to the certificate on fewer hours.
            </p>
            <p className="mt-4 text-pretty text-base leading-relaxed text-[#68717D]">
              Vector starts with your actual training record, and reaches for the FAA Airplane Flying Handbook, the
              ACS and your POH when the answer needs a source.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
