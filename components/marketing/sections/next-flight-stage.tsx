import { NextFlightCard } from "@/components/marketing/next-flight-card";
import { CapabilityCards } from "@/components/marketing/sections/capabilities";
import { PersonalizedTrainingCard } from "@/components/marketing/sections/personalized-training";
import { Reveal } from "@/components/marketing/reveal";
import { StageModule } from "@/components/marketing/stage-module";
import { StageRail } from "@/components/marketing/stage-rail";

/**
 * The Next Flight stage, in the same band structure as Debrief.
 *
 * Order is the plan, then the training it produces, then the tools you use in
 * between -- and that order was challenged, so it is worth writing down why it
 * held. The objection was chronological: in real life you prepare and then you
 * fly, so the flight should come last.
 *
 * The section is not the flight. It is the PLAN for the flight, generated at
 * debrief time, and a plan is what tells you what to prepare. On strict
 * chronology the plan still comes first.
 *
 * Two more reasons it stays:
 *
 *  - Both headlines encode the position. "Your next flight starts where your
 *    last one left off" reaches back at the debrief, so it works adjacent to
 *    it and weakens with distance. "Your next flight gets easier before you
 *    fly it" presupposes the next flight as an established thing; leading with
 *    it introduces the phrase cold.
 *  - The card is one concrete artifact and the capability tiles are four
 *    abstractions. Showing the artifact and then explaining the machinery
 *    behind it beats four abstractions followed by the reveal.
 *
 * The argument that DID die: the nav anchor. #next-flight had to lead the
 * stage while Next Flight was a primary nav item, or the link would skip the
 * preparation. The nav is now How It Works / Demo / Field Notes / Pricing and
 * nothing links #next-flight, so that constraint is gone. The order stands on
 * the copy alone.
 */
const MODULES = [
  { id: "next-flight", label: "What you'll work on" },
  { id: "next-flight-training", label: "How it becomes practice" },
  { id: "next-flight-between", label: "What you do between" },
] as const;

export function NextFlightStage() {
  return (
    <section className="bg-[#f4f5f6] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1180px]">
        <Reveal className="lg:hidden">
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.22em] text-brand">Next flight</p>
          <h2 className="font-display mt-3 text-balance text-4xl font-bold leading-[1.06] text-[#101727]">
            Everything the last flight produced, pointed at the next one.
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-[#414B57]">
            The plan, the practice it turns into, and what you do with the days in between.
          </p>
        </Reveal>

        <div className="lg:grid lg:grid-cols-[210px_1fr] lg:gap-x-20 xl:grid-cols-[230px_1fr]">
          <StageRail
            stage="Next flight"
            framing="Everything the last flight produced, pointed at the next one."
            modules={MODULES}
          />

          <div className="mt-14 flex flex-col lg:mt-0">
            <StageModule
              id={MODULES[0].id}
              eyebrow="Next flight"
              headline="Your next flight starts where your last one left off."
              body="Instead of showing up trying to remember where the last lesson ended, you arrive knowing what to focus on. Built from the flight you just flew — not from a syllabus template."
            >
              <NextFlightCard />
            </StageModule>

            {/* Tighter, because this explains the card above it. */}
            <StageModule
              id={MODULES[1].id}
              className="mt-20 sm:mt-24"
              eyebrow="Personalized training"
              headline={
                <>
                  Don&rsquo;t just read about the problem. <span className="text-brand">Fix it.</span>
                </>
              }
              body="AfterFlight turns the weak areas from your actual flight into short training sessions, flight-specific questions, and cues you can carry into the cockpit next time."
            >
              <PersonalizedTrainingCard />
            </StageModule>

            {/* Wider, because this changes the subject from one skill to the
                whole of the time between lessons. */}
            <StageModule
              id={MODULES[2].id}
              className="mt-24 sm:mt-32"
              eyebrow="Between your flights"
              headline="Your next flight gets easier before you fly it."
              body="The days between lessons are the cheapest training time you have. These are the four things AfterFlight gives you to spend them on."
            >
              <CapabilityCards />
            </StageModule>
          </div>
        </div>
      </div>
    </section>
  );
}
