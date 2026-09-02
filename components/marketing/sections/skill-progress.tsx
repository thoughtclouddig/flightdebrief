import { Reveal } from "@/components/marketing/reveal";
import { SectionHead } from "@/components/marketing/section-head";

/**
 * Skill-level progress, with the evidence attached.
 *
 * This replaces the FlightScore gauge that used to sit here. A single
 * aggregate number implies AfterFlight can certify readiness, which it cannot
 * -- the signoff belongs to the instructor, and a forward verdict would put
 * the product against the person whose judgment actually governs.
 *
 * A score tied to ONE skill with the instructor's own sentence next to it has
 * the opposite property: it is checkable. That is the whole rule. Skill-level
 * scoring is allowed when it is sourced, explainable and tied to specific
 * training evidence; overall readiness verdicts are not.
 */
/*
 * Ordered along the scale, worst to best.
 *
 * These were Improving, Needs Work, Meets Standard -- which is no order at
 * all, so three cards that ARE one progression read as three arbitrary
 * examples. Left to right they now walk the scale the paragraph above names,
 * and the section stops needing to explain that they belong together.
 */
const SKILLS = [
  {
    skill: "Stabilized Approach",
    score: 2,
    state: "Needs Work",
    tone: "text-[#9a6612]",
    fill: "bg-[#9a6612]",
    edge: "border-t-[#9a6612]",
    why: "Fast on two of four, and fixing it late instead of configuring earlier.",
    next: "Three-minute review, then a chair-fly of the pattern.",
  },
  {
    skill: "Crosswind Landing",
    score: 3,
    state: "Improving",
    tone: "text-[#2c6c93]",
    fill: "bg-[#2c6c93]",
    edge: "border-t-[#2c6c93]",
    why: "Centerline improved, but you relax the correction through touchdown.",
    next: "Review crosswind correction with Vector before your next flight.",
  },
  {
    skill: "Short-Field Landing",
    score: 4,
    state: "Meets Standard",
    tone: "text-[#1f7a4c]",
    fill: "bg-[#1f7a4c]",
    edge: "border-t-[#1f7a4c]",
    why: "Aiming point hit on three of four.",
    next: "Nothing before Thursday. Keep it warm.",
  },
] as const;

export function SkillProgress() {
  return (
    <section id="progress" className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1100px]">
        <SectionHead
          eyebrow="Progress"
          headline={
            <>
              {/* Two lines, stated. At the default 48px "and what still needs
                  work." measures 716px against a 672px column, so balance had
                  no two-line solution and broke it into three. */}
              <span className="sm:block">See what&rsquo;s improving,</span>{" "}
              <span className="sm:block">and what still needs work.</span>
            </>
          }
        />

        {/* Naming the scale once. Without it three colored chips look like
            arbitrary labels; with it they read as one progression, which is the
            point -- AfterFlight shows where a skill sits, not a score out of
            something. The wording is the student's half of the two-vocabulary
            model in lib/prototype/assessment.ts; a CFI sees Meets Standard
            where a student sees Felt Solid, over the same underlying code. */}
        <p className="mx-auto mt-10 max-w-[700px] text-balance text-center text-sm text-[#414B57]">
          Every skill sits somewhere on the same scale &mdash;{" "}
          <span className="font-semibold text-[#9a6612]">Needs Work</span>,{" "}
          <span className="font-semibold text-[#2c6c93]">Improving</span>,{" "}
          <span className="font-semibold text-[#1f7a4c]">Meets Standard</span> &mdash; set by your instructor, never
          by an algorithm.
        </p>

        {/* Three across, not stacked. As a vertical list of three full-width
            cards the section was mostly scrolling -- and the three skills are
            a set to compare, not a sequence to read in order. */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {SKILLS.map((s, i) => (
            <Reveal key={s.skill} delay={100 + i * 90} className="h-full">
              {/* h-full on both the Reveal and the article. The grid stretches its
                  direct children, but the Reveal wrapper was the child -- the
                  article inside it sized to its own content, so three cards
                  with different amounts of evidence ended at three different
                  heights. */}
              {/*
                * Deliberately not a tinted pill on a soft gray box. That is
                * the default SaaS card, and three of them side by side is the
                * shape of a pricing table, not a training record.
                *
                * The state drives the card instead: a 3px rule in the state
                * color across the top -- the same device the perception-gap
                * cards use to separate two voices -- with the state named
                * under the skill in its own color. White ground and a real
                * hairline, so the card sits ON the section rather than
                * floating in it, and a smaller radius, because the softness
                * was doing most of the genericness.
                */}
              <article className={`flex h-full flex-col overflow-hidden rounded-lg border border-black/[0.09] border-t-[3px] bg-white ${s.edge}`}>
                <div className="flex flex-1 flex-col px-7 py-6 sm:px-8">
                <h3 className="font-display text-xl font-bold leading-snug text-[#101727]">{s.skill}</h3>
                <p className={`mt-1.5 text-[13px] font-bold uppercase tracking-[0.1em] ${s.tone}`}>{s.state}</p>

                {/* Square ticks, not rounded pills. Four positions on a fixed
                    scale reads as an instrument; four lozenges reads as a
                    progress bar toward a total, which is the one thing this
                    number is not. */}
                <span
                  className="mt-4 flex items-center gap-1.5"
                  role="img"
                  aria-label={`${s.state}, ${s.score} of 4`}
                >
                  {[0, 1, 2, 3].map((n) => (
                    <span
                      key={n}
                      className={`h-1.5 w-7 rounded-[1px] ${n < s.score ? s.fill : "bg-[#c7ccd1]"}`}
                    />
                  ))}
                </span>

{/*
                    A tinted footer, not another hairline.
                    
                    The card holds four things -- skill, state, evidence, next
                    step -- and they were all the same size on the same ground
                    with rules between them, which is why it read as one run of
                    text. A rule says "these are adjacent". A change of ground
                    says "these are different kinds of thing", and NEXT is a
                    different kind of thing: everything above it is a report on
                    the last flight, and it is the only part you act on.
                    
                    The WHY label is gone. An 11px caps label above a quotation
                    mark was labeling something already obvious, and it sat at
                    the same weight as NEXT, so the two competed. The
                    attribution under the quote does that job and carries more:
                    it says whose judgment this is. */}
                <blockquote className="mt-5 border-l-2 border-black/[0.13] pl-4 text-pretty text-[15px] italic leading-relaxed text-[#414B57]">
                  &ldquo;{s.why}&rdquo;
                </blockquote>
                <p className="mt-2 pl-4 text-[13px] text-[#4E5A67]">Jake, your CFI</p>
                </div>

                <div className="mt-auto border-t border-black/[0.08] bg-[#f4f5f6] px-7 py-5 sm:px-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">Next</p>
                  <p className="mt-1.5 text-pretty text-[17px] font-semibold leading-snug text-[#101727]">{s.next}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {/* A claim, not a footnote, and no rule above it -- the cards
            already end on a hard edge and a second horizontal line an inch
            below it was drawing the same boundary twice. Weight and space
            separate this now, which is what was missing: at 17px gray with a
            hairline it looked like small print someone was obliged to add,
            when it is the reason the cards carry an instructor's sentence
            instead of a number. */}
        <p className="font-display mx-auto mt-16 max-w-[44ch] text-balance text-center text-xl font-bold leading-snug text-[#101727] sm:text-2xl">
          Readiness is <span className="text-brand">your instructor&rsquo;s call, not ours.</span>
        </p>
      </div>
    </section>
  );
}
