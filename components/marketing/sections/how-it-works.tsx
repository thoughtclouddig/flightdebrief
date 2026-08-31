import { ClipboardList, Mic, PlaneTakeoff, Sparkles } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { SectionHead } from "@/components/marketing/section-head";

/**
 * The learning loop, in four steps.
 *
 * Replaces the six-card sequence that walked through CFI assessment, student
 * assessment, recording, summary, recap and next lesson. That sequence was an
 * accurate description of the workflow and the wrong thing to lead with: it
 * read as a training-records product, with the debrief as the whole point.
 * The debrief is the INPUT. What the student buys is what happens after it.
 */
const STEPS = [
  {
    icon: Mic,
    label: "Debrief",
    headline: "Your instructor talks through the flight.",
    copy: "The way they normally do. No forms, no grading grid, no extra work for either of you.",
  },
  {
    icon: ClipboardList,
    label: "Understand",
    headline: "AfterFlight sorts out what mattered.",
    copy: "What went well, what still needs work, and where your read of the flight differs from your instructor's.",
  },
  {
    icon: Sparkles,
    label: "Train with Vector",
    headline: "Work the weak spots before you fly again.",
    copy: "Vector explains what your instructor meant, checks your understanding, and rehearses the parts you're still getting wrong.",
  },
  {
    icon: PlaneTakeoff,
    label: "Fly prepared",
    headline: "Show up knowing what you're there to fix.",
    copy: "A short list of things to study, remember and practise — before you spend money on the next hour.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#f4f5f6] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1100px]">
        <SectionHead
          eyebrow="How it works"
          headline="One flight, four steps, no wasted lesson."
          body="The debrief already happens. AfterFlight is what turns it into something you can actually train against."
        />

        <ol className="mt-16 grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2">
          {STEPS.map((step, i) => (
            <Reveal key={step.label} delay={i * 90}>
              <li className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-brand shadow-[0_2px_8px_-2px_rgba(16,23,39,0.12)]">
                    <step.icon className="size-5" strokeWidth={2} aria-hidden />
                  </span>
                  {/* Numbered because this genuinely is a sequence -- each step
                      only makes sense after the one before it. */}
                  <span className="text-sm font-bold uppercase tracking-[0.14em] text-[#68717D]">
                    Step {i + 1} · {step.label}
                  </span>
                </div>
                <div>
                  <p className="font-display text-balance text-xl font-bold text-[#101727] sm:text-2xl">
                    {step.headline}
                  </p>
                  <p className="text-pretty mt-2 text-base leading-relaxed text-[#68717D]">{step.copy}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
