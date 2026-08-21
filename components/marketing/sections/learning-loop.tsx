import Image from "next/image";
import { MessageCircle, Headphones, FileText } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const FORMATS = [
  {
    icon: MessageCircle,
    label: "Live conversation",
    copy: "Talk it through with your CFI right after you land, while it's fresh.",
  },
  {
    icon: Headphones,
    label: "Audio narration",
    copy: "Replay a spoken summary of the debrief anytime -- on the drive home, before your next lesson.",
  },
  {
    icon: FileText,
    label: "Written summary",
    copy: "A text summary with action items you can reread and check off before you fly again.",
  },
] as const;

const FRAMES = [
  {
    eyebrow: "Fly",
    headline: "Fly the lesson.",
    copy: "Focus on flying. AfterFlight picks up when the engine shuts down.",
    src: "/images/marketing/pilot-lifestyle-smile.webp",
    alt: "A confident student pilot smiling at the controls during a scenic flight",
  },
  {
    eyebrow: "Debrief",
    headline: "Make every debrief count.",
    copy: "Capture what happened, what went well, and what needs work before the details fade.",
    src: "/images/marketing/debrief-lounge-screen.webp",
    alt: "A student pilot and CFI talking through a flight debrief together",
  },
  {
    eyebrow: "Study",
    headline: "Know what to work on.",
    copy: "Connect your feedback to the right ACS standards, FAA references, and instructor resources.",
    src: "/images/marketing/student-studying-acs.webp",
    alt: "A student pilot reviewing FAA Airman Certification Standards on a tablet at a desk with the Airplane Flying Handbook",
  },
  {
    eyebrow: "Improve",
    headline: "Come back better prepared.",
    copy: "Turn what you learned into a clear plan for the next flight—and keep building from there.",
    src: "/images/marketing/wing-view-sunset.webp",
    alt: "View along the wing of a training aircraft over a river valley at sunset",
  },
] as const;

export function LearningLoop() {
  return (
    <section id="how-it-works" className="bg-white px-6 py-28 sm:py-36">
      <div className="mx-auto max-w-[1320px]">
        <Reveal className="text-center">
          <h2 className="font-display text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
            How AfterFlight Works
          </h2>
          <p className="mt-4 text-balance text-lg text-[#68717D]">
            Your flight ends. AfterFlight turns the debrief into something you can actually use.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2">
          {FRAMES.map((frame, i) => (
            <Reveal key={frame.eyebrow} delay={i * 100} className="group flex flex-col gap-4">
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src={frame.src}
                  alt={frame.alt}
                  fill
                  priority
                  className="scale-[1.12] object-cover transition-transform duration-700 ease-out group-hover:translate-x-[3%] group-hover:scale-[1.18] motion-reduce:transition-none"
                  sizes="(min-width: 640px) 644px, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent" />
                <p className="font-display absolute bottom-4 left-5 text-4xl font-extrabold uppercase tracking-wide text-white sm:text-5xl">
                  {frame.eyebrow}
                </p>
              </div>
              <div>
                <p className="font-display text-balance text-xl font-bold text-[#101727]">{frame.headline}</p>
                <p className="text-pretty mt-1.5 text-base text-[#68717D]">{frame.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={400} className="mx-auto mt-16 max-w-4xl border-t border-[#E5E8EC] pt-10 text-center">
          <h3 className="font-display text-balance text-xl font-bold text-[#101727] sm:text-2xl">
            Why three formats, not one
          </h3>
          <p className="text-balance mt-3 text-base text-[#68717D]">
            Memory research on multimedia learning has repeatedly found that pairing spoken and written review
            measurably improves retention over either alone.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {FORMATS.map(({ icon: Icon, label, copy }) => (
              <div key={label} className="flex flex-col items-center gap-2 text-center">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10">
                  <Icon className="size-5 text-brand" strokeWidth={2} />
                </span>
                <p className="font-display text-base font-bold text-[#101727]">{label}</p>
                <p className="text-pretty text-base text-[#68717D]">{copy}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
