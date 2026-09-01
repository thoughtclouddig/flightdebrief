import { Reveal } from "@/components/marketing/reveal";

/**
 * The founder beat, kept deliberately short.
 *
 * A founder story earns its place on this page for one reason: it is the
 * evidence that the problem was observed rather than researched. That takes a
 * paragraph. Everything past that -- the flying résumé, the origin anecdote,
 * the mission statement -- turns the section into a claim about the founder
 * instead of a claim about the problem, and the student reading it does not
 * care yet.
 *
 * Signed, because the section is written in the first person and an anonymous
 * byline on a personal origin story is worse than either alone. No photograph
 * yet -- add one here when there is a real one.
 */
export function FounderStory() {
  return (
    <section className="bg-white px-6 py-24 sm:py-28">
      <Reveal className="mx-auto max-w-[720px]">
        <p className="text-balance text-xs font-bold uppercase tracking-[0.16em] text-brand">Why we built it</p>
        <h2 className="font-display mt-3 text-balance text-3xl font-bold leading-tight text-[#101727] sm:text-4xl">
          I built AfterFlight because I kept losing the thread.
        </h2>

        <div className="mt-6 flex flex-col gap-4 text-balance text-lg leading-relaxed text-[#68717D]">
          <p>
            Across multiple instructors, the debrief was often the weakest part of my training. Important
            feedback got rushed, forgotten, or disconnected from the next lesson. Sometimes I showed up days
            later trying to remember what I was supposed to fix.
          </p>
          <p className="text-[#101727]">
            In flight training, broken continuity isn&rsquo;t just frustrating. It&rsquo;s expensive.
          </p>
          <p>AfterFlight started with a simple idea:</p>
        </div>

        <p className="font-display mt-6 text-balance text-2xl font-bold leading-snug text-[#101727] sm:text-3xl">
          Every flight should <span className="text-brand">build on the last.</span>
        </p>

        {/* Name set as a name, not as a tracked all-caps run: uppercase past
            about three words stops reading as a label and starts reading as
            shouting, and a signature is the one line that should look like a
            person wrote it. */}
        <div className="mt-7 border-t border-black/[0.08] pt-5">
          <p className="font-display text-lg font-bold text-[#101727]">Andy Renk</p>
          <p className="mt-0.5 text-[15px] text-[#68717D]">Founder, AfterFlight</p>
        </div>
      </Reveal>
    </section>
  );
}
