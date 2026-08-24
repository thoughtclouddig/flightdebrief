import { Reveal } from "@/components/marketing/reveal";
import { PhotoVisual } from "@/components/marketing/app-screen";

// Actual chronological sequence of a real debrief, not a topical feature
// list -- each step is what happens next, in order, so a first-time visitor
// understands the process before they ever open the app.
const CARDS = [
  {
    eyebrow: "Step 1",
    headline: "The CFI rates the flight first.",
    copy: "Before any conversation happens, the instructor completes their own assessment of the flight.",
    src: "/images/marketing/debrief-boardroom-screen.webp",
    alt: "A CFI reviewing a flight assessment on a screen before the debrief conversation begins",
  },
  {
    eyebrow: "Step 2",
    headline: "The student does the same, independently.",
    copy: "No peeking at each other's notes -- the student rates their own flight before the debrief starts.",
    src: "/images/marketing/debrief-lounge-screen.webp",
    alt: "A student pilot completing their own flight self-assessment separately from the instructor",
  },
  {
    eyebrow: "Step 3",
    headline: "Then they record the debrief, together.",
    copy: "The CFI hits record and walks through a structured conversation, guided by where the two assessments agree -- and where they don't.",
    src: "/images/marketing/debrief-conference-room.webp",
    alt: "A CFI and student pilot reviewing a debrief summary together, with the flight's key takeaways and action items shown on a screen behind them",
  },
  {
    eyebrow: "Step 4",
    headline: "AfterFlight turns it into a clear summary.",
    copy: "What went well, what needs work, rated and organized -- the moment the recording stops.",
    src: "/images/marketing/flight-summary-card.avif",
    alt: "AfterFlight app screen showing a completed flight summary with what went well, areas to improve, action items, and key takeaways",
  },
  {
    eyebrow: "Step 5",
    headline: "The student gets the recap, plus what to study.",
    copy: "A recording of the debrief to revisit any time, and every weak area linked straight to the ACS standard and training resource that covers it.",
    src: "/images/marketing/acs-connection-card.webp",
    alt: "AfterFlight app screen showing an Area to Improve card for Steep Turns and Altitude Control, connected to ACS standard PA.V.A.S3",
  },
  {
    eyebrow: "Step 6",
    headline: "Show up confident for the next lesson.",
    copy: "Last debrief becomes this lesson's plan -- what to practice, what to focus on, so nobody's guessing.",
    src: "/images/marketing/next-flight-card.avif",
    alt: "AfterFlight app screen showing three focus areas for the next flight: steep turns, short-field landing, and radio calls",
  },
] as const;

export function EverythingThatMatters() {
  return (
    <section id="how-it-works" className="bg-[#f4f5f6] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1320px]">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-balance text-lg font-bold uppercase tracking-[0.16em] text-brand sm:text-xl">The Process</p>
          <h2 className="font-display mt-3 text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
            What actually happens after you land.
          </h2>
          <p className="mt-4 text-balance text-lg text-[#68717D]">
            The same debrief you already do -- rated separately, discussed together, and turned into a clear
            record and a plan for next time.
          </p>
        </Reveal>

        <div className="mt-20 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card, i) => (
            <Reveal key={card.eyebrow} delay={(i % 3) * 100} className="flex flex-col gap-4">
              <PhotoVisual src={card.src} alt={card.alt} label={card.eyebrow} />
              <div>
                <p className="font-display text-balance text-xl font-bold text-[#101727]">{card.headline}</p>
                <p className="text-pretty mt-2 text-base leading-relaxed text-[#68717D]">{card.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
