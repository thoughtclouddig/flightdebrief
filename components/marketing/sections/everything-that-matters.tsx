import { Reveal } from "@/components/marketing/reveal";
import { PhotoVisual } from "@/components/marketing/app-screen";

const CARDS = [
  {
    eyebrow: "Guided Debriefs",
    headline: "Make every debrief count.",
    copy: "Structured prompts guide the conversation between student and instructor so the important parts of the flight don't disappear when the debrief ends.",
    visual: (
      <PhotoVisual
        src="/images/marketing/debrief-conference-room.webp"
        alt="A CFI and student pilot reviewing a debrief summary together, with the flight's key takeaways and action items shown on a screen behind them"
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

const PROCESS_STEPS = [
  { label: "Reflect", detail: "Student self-assessment, right after landing." },
  { label: "Instructor's Read", detail: "The CFI's own assessment of the same flight." },
  { label: "Talk It Through", detail: "What worked, what didn't, and any judgment calls along the way." },
  { label: "Next-Flight Focus", detail: "Clear priorities carried into the next lesson." },
  { label: "Your Record", detail: "Everything saved to the student's training history." },
] as const;

export function EverythingThatMatters() {
  return (
    <section id="how-it-works" className="bg-[#f4f5f6] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1320px]">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-balance text-xs font-bold uppercase tracking-[0.16em] text-brand">The Solution</p>
          <h2 className="font-display mt-3 text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
            One debrief. Everything you need for the next flight.
          </h2>
          <p className="mt-4 text-balance text-lg text-[#68717D]">
            AfterFlight turns the conversation you already have after landing into a clear record of what happened,
            what to work on, and what comes next.
          </p>
        </Reveal>

        <Reveal className="mx-auto mt-16 max-w-4xl">
          <p className="text-balance text-center text-sm font-semibold text-[#68717D]">
            A guided conversation, not another form.
          </p>

          <div className="relative mt-10">
            <div
              className="absolute left-[10%] right-[10%] top-5 hidden h-px bg-[#e4e7ea] sm:block"
              aria-hidden="true"
            />
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-5 sm:gap-4">
              {PROCESS_STEPS.map((step, i) => (
                <Reveal
                  key={step.label}
                  delay={i * 80}
                  className="relative flex items-start gap-4 sm:flex-col sm:items-center sm:gap-3 sm:text-center"
                >
                  <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-brand bg-white text-sm font-bold text-brand">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-display text-base font-bold text-[#101727]">{step.label}</p>
                    <p className="text-pretty mt-1 text-sm leading-relaxed text-[#68717D] sm:max-w-[10rem]">
                      {step.detail}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <p className="text-balance mt-12 text-center text-lg font-semibold text-[#101727]">
            This flight becomes the starting point for the next one.
          </p>
        </Reveal>

        <div className="mt-20 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
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
