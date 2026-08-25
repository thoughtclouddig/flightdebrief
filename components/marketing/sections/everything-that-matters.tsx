import { Reveal } from "@/components/marketing/reveal";
import { PhotoVisual } from "@/components/marketing/app-screen";
import { DebriefRecapDemo } from "@/components/marketing/debrief-recap-demo";

// Actual chronological sequence of a real debrief, not a topical feature
// list -- each step is what happens next, in order, so a first-time visitor
// understands the process before they ever open the app.
const CARDS = [
  {
    eyebrow: "Step 1",
    headline: "The CFI opens AfterFlight and rates the flight.",
    copy: "Before any conversation happens -- their own take, on their own.",
    src: "/images/marketing/how-it-works-1.avif",
    alt: "A CFI reviewing a flight assessment in AfterFlight before the debrief conversation begins",
  },
  {
    eyebrow: "Step 2",
    headline: "The student opens the app and does the same.",
    copy: "No peeking at each other's notes -- just their own honest read.",
    src: "/images/marketing/how-it-works-2.avif",
    alt: "A student pilot completing their own flight self-assessment in AfterFlight, separately from the instructor",
  },
  {
    eyebrow: "Step 3",
    headline: "The CFI hits Record for the structured debrief.",
    copy: "Guided by where the two ratings agree -- and where they don't.",
    src: "/images/marketing/how-it-works-3.avif",
    alt: "A CFI and student pilot recording a structured debrief in AfterFlight, with the flight's key takeaways shown on a screen behind them",
  },
  {
    eyebrow: "Step 4",
    headline: "AfterFlight turns it into a clear summary.",
    copy: "Rated and organized -- what went well, what needs work.",
    src: "/images/marketing/how-it-works-4.avif",
    alt: "AfterFlight app screen showing a completed flight summary with what went well, areas to improve, action items, and key takeaways",
  },
  {
    eyebrow: "Step 5",
    headline: "The student gets the recap, plus what to study.",
    copy: "A recorded overview, and every weak area linked to the ACS.",
    src: "/images/marketing/how-it-works-5.avif",
    alt: "AfterFlight app screen showing an Area to Improve card for Steep Turns and Altitude Control, connected to ACS standard PA.V.A.S3",
  },
  {
    eyebrow: "Step 6",
    headline: "Student and instructor start the next lesson on the same page.",
    copy: "Last debrief becomes this lesson's plan -- for both of you, no guessing.",
    src: "/images/marketing/how-it-works-6.avif",
    alt: "AfterFlight app screen showing three focus areas for the next flight: steep turns, short-field landing, and radio calls",
  },
] as const;

export function EverythingThatMatters() {
  return (
    <section id="how-it-works" className="bg-[#f4f5f6] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1320px]">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-balance text-lg font-bold uppercase tracking-[0.16em] text-brand sm:text-xl">The Debrief</p>
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

        <DebriefRecapDemo />
      </div>
    </section>
  );
}
