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
const SKILLS = [
  {
    skill: "Crosswind Landing",
    score: 3,
    state: "Improving",
    chip: "bg-[#2c6c93]/10",
    tone: "text-[#2c6c93]",
    fill: "bg-[#2c6c93]",
    why: "Jake said centerline control improved, but correction is still being relaxed through touchdown.",
    next: "Review crosswind correction with Vector before your next flight.",
  },
  {
    skill: "Stabilized Approach",
    score: 2,
    state: "Needs Work",
    chip: "bg-[#9a6612]/10",
    tone: "text-[#9a6612]",
    fill: "bg-[#9a6612]",
    why: "Fast on two of four approaches, and fixing the speed late rather than configuring earlier.",
    next: "Three-minute review, then a chair-fly of the pattern.",
  },
  {
    skill: "Short-Field Landing",
    score: 4,
    state: "Meets Standard",
    chip: "bg-[#1f7a4c]/10",
    tone: "text-[#1f7a4c]",
    fill: "bg-[#1f7a4c]",
    why: "Aiming point hit on three of four. Jake didn't leave this one open.",
    next: "Nothing before Thursday. Keep it warm.",
  },
] as const;

export function SkillProgress() {
  return (
    <section id="progress" className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1100px]">
        <SectionHead
          eyebrow="Progress"
          headline="See what's improving, and what still needs work."
          body="Progress with the evidence behind it — your instructor's own words from the flights you actually flew."
        />

        {/* Naming the scale once. Without it three colored chips look like
            arbitrary labels; with it they read as one progression, which is the
            point -- AfterFlight shows where a skill sits, not a score out of
            something. The wording is the student's half of the two-vocabulary
            model in lib/prototype/assessment.ts; a CFI sees Meets Standard
            where a student sees Felt Solid, over the same underlying code. */}
        <p className="mx-auto mt-10 max-w-[760px] text-center text-sm text-[#68717D]">
          Every skill sits somewhere on the same scale &mdash;{" "}
          <span className="font-semibold text-[#9a6612]">Needs Work</span>,{" "}
          <span className="font-semibold text-[#2c6c93]">Improving</span>,{" "}
          <span className="font-semibold text-[#1f7a4c]">Meets Standard</span> &mdash; set by your instructor, never
          by an algorithm.
        </p>

        <div className="mx-auto mt-8 flex max-w-[760px] flex-col gap-5">
          {SKILLS.map((s, i) => (
            <Reveal key={s.skill} delay={100 + i * 90}>
              <article className="rounded-2xl border border-black/[0.06] bg-[#f4f5f6] px-7 py-7 sm:px-9">
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                  <h3 className="font-display text-xl font-bold text-[#101727] sm:text-2xl">{s.skill}</h3>
                  <div className="flex items-center gap-3.5">
                    {/* Four segments rather than "3/4": the level is read in one
                        glance, and the number survives for screen readers. */}
                    <span className="flex items-center gap-1" role="img" aria-label={`${s.state}, ${s.score} of 4`}>
                      {[0, 1, 2, 3].map((n) => (
                        <span
                          key={n}
                          className={`h-2.5 w-7 rounded-full ${n < s.score ? s.fill : "bg-[#c7ccd1]"}`}
                        />
                      ))}
                    </span>
                    {/* The state is the product's actual model, so it reads as
                        a state and not as a caption: a tinted chip carrying the
                        same color as its meter. Visible without becoming the
                        loudest thing on the card -- the skill name still leads. */}
                    <span
                      className={`rounded-md px-2.5 py-1 text-sm font-bold uppercase tracking-[0.06em] ${s.tone} ${s.chip}`}
                    >
                      {s.state}
                    </span>
                  </div>
                </div>

                <dl className="mt-6 flex flex-col gap-5">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#68717D]">Why</dt>
                    <dd className="mt-2 text-pretty text-lg italic leading-relaxed text-[#4b545d]">
                      &ldquo;{s.why}&rdquo;
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#68717D]">Next</dt>
                    <dd className="mt-2 text-pretty text-lg leading-relaxed text-[#101727]">{s.next}</dd>
                  </div>
                </dl>
              </article>
            </Reveal>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-xl text-balance text-center text-sm leading-relaxed text-[#68717D]">
          No overall score, and no readiness percentage. Whether you&rsquo;re ready to solo or take a checkride is
          your instructor&rsquo;s call, not ours.
        </p>
      </div>
    </section>
  );
}
