import { Reveal } from "@/components/marketing/reveal";
import { PhotoVisual } from "@/components/marketing/app-screen";

const CARDS = [
  {
    eyebrow: "Guided Debriefs",
    headline: "Make every debrief count.",
    copy: "Structured prompts guide the conversation between student and instructor so the important parts of the flight don't disappear when the debrief ends.",
    visual: (
      <PhotoVisual
        src="/images/marketing/debrief-lounge-screen.webp"
        alt="A student pilot and CFI debriefing together immediately after a flight"
      />
    ),
  },
  {
    eyebrow: "Flight Summary",
    headline: "Your whole debrief. Organized.",
    copy: "What went well, what needs work, instructor observations, action items, and key takeaways stay together in one useful flight record.",
    visual: (
      <PhotoVisual
        src="/images/marketing/flight-summary-card.avif"
        alt="AfterFlight app screen showing a completed flight summary with what went well, areas to improve, action items, and key takeaways"
      />
    ),
  },
  {
    eyebrow: "ACS Connection",
    headline: "Feedback, connected to the ACS.",
    copy: "AfterFlight connects relevant lesson feedback to FAA Airman Certification Standards so you can see what you're working toward.",
    visual: (
      <PhotoVisual
        src="/images/marketing/acs-connection-card.webp"
        alt="AfterFlight app screen showing an Area to Improve card for Steep Turns and Altitude Control, connected to ACS standard PA.V.A.S3"
      />
    ),
  },
  {
    eyebrow: "Study Resources",
    headline: "Know exactly what to study next.",
    copy: "Go from a weak area directly to relevant FAA references, instructor resources, and school training material.",
    visual: (
      <PhotoVisual
        src="/images/marketing/student-studying-acs.webp"
        alt="A student pilot reviewing FAA Airman Certification Standards on a tablet at a desk with the Airplane Flying Handbook"
      />
    ),
  },
  {
    eyebrow: "Next-Flight Briefing",
    headline: "Show up ready to fly.",
    copy: "AfterFlight turns the last debrief into a clear starting point for the next lesson: what to practice, what to study, and where to focus.",
    visual: (
      <PhotoVisual
        src="/images/marketing/next-flight-card.avif"
        alt="AfterFlight app screen showing three focus areas for the next flight: steep turns, short-field landing, and radio calls"
      />
    ),
  },
  {
    eyebrow: "Training Progress",
    headline: "See your training take shape.",
    copy: "Instructor-reviewed observations across flights reveal where you're improving, what keeps recurring, and where more work is needed.",
    visual: (
      <PhotoVisual
        src="/images/marketing/training-progress-card.avif"
        alt="AfterFlight app screen showing training progress across five skill areas: Aircraft Control, Procedures, Navigation, Communication, and Decision Making"
      />
    ),
  },
] as const;

export function EverythingThatMatters() {
  return (
    <section className="bg-[#f4f5f6] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1320px]">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
            Everything AfterFlight does after you land.
          </h2>
          <p className="mt-4 text-balance text-lg text-[#68717D]">
            AfterFlight captures the conversation, organizes what matters, connects it to the standards, and turns
            it into a plan for your next flight.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card, i) => (
            <Reveal key={card.eyebrow} delay={(i % 3) * 100} className="flex flex-col gap-4">
              {card.visual}
              <div>
                <p className="text-balance text-xs font-bold uppercase tracking-[0.14em] text-brand">{card.eyebrow}</p>
                <p className="font-display mt-1.5 text-balance text-xl font-bold text-[#101727]">{card.headline}</p>
                <p className="text-pretty mt-2 text-sm leading-relaxed text-[#68717D]">{card.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
