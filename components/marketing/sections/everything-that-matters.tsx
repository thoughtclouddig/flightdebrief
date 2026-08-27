"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { DebriefRecapDemo } from "@/components/marketing/debrief-recap-demo";
import { cn } from "@/lib/utils";

// Actual chronological sequence of a real debrief, not a topical feature
// list -- each step is what happens next, in order, so a first-time visitor
// understands the process before they ever open the app.
const CARDS = [
  {
    stepLabel: "CFI Assessment",
    headline: "The CFI opens AfterFlight and rates the flight.",
    copy: "Before any conversation happens -- their own take, on their own.",
    src: "/images/marketing/how-it-works-1.avif",
    alt: "A CFI reviewing a flight assessment in AfterFlight before the debrief conversation begins",
  },
  {
    stepLabel: "Student Assessment",
    headline: "The student opens the app and does the same.",
    copy: "No peeking at each other's notes -- just their own honest read.",
    src: "/images/marketing/how-it-works-2.avif",
    alt: "A student pilot completing their own flight self-assessment in AfterFlight, separately from the instructor",
  },
  {
    stepLabel: "The Debrief",
    headline: "The CFI hits Record for the structured debrief.",
    copy: "Guided by where the two ratings agree -- and where they don't.",
    src: "/images/marketing/how-it-works-3.avif",
    alt: "A CFI and student pilot recording a structured debrief in AfterFlight, with the flight's key takeaways shown on a screen behind them",
  },
  {
    stepLabel: "The Summary",
    headline: "AfterFlight turns it into a clear summary.",
    copy: "Rated and organized -- what went well, what needs work.",
    src: "/images/marketing/how-it-works-4.avif",
    alt: "AfterFlight app screen showing a completed flight summary with what went well, areas to improve, action items, and key takeaways",
  },
  {
    stepLabel: "The Recap",
    headline: "The student gets the recap, plus what to study.",
    copy: "A recorded overview, and every weak area linked to the ACS.",
    src: "/images/marketing/how-it-works-5.avif",
    alt: "AfterFlight app screen showing an Area to Improve card for Steep Turns and Altitude Control, connected to ACS standard PA.V.A.S3",
  },
  {
    stepLabel: "Next Lesson",
    headline: "Student and instructor start the next lesson on the same page.",
    copy: "Last debrief becomes this lesson's plan -- for both of you, no guessing.",
    src: "/images/marketing/how-it-works-6.avif",
    alt: "AfterFlight app screen showing three focus areas for the next flight: steep turns, short-field landing, and radio calls",
  },
] as const;

// The active slide is centered (not start-aligned) so both neighbors peek --
// previous on the left, next on the right. Both the track and the controls
// row below it break out to the full viewport width (matching the active
// slide's own width, which can exceed the section's max-width container),
// centering an inner track inside that full-bleed shell.
const SLIDE_WIDTH = "min(90vw,1400px)";

export function EverythingThatMatters() {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const index = slideRefs.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) setActive(index);
          }
        });
      },
      { root: track, threshold: [0.6] },
    );
    slideRefs.current.forEach((slide) => slide && observer.observe(slide));
    return () => observer.disconnect();
  }, []);

  function scrollToSlide(index: number) {
    const track = trackRef.current;
    const slide = slideRefs.current[index];
    if (!track || !slide) return;
    const target = slide.offsetLeft + slide.offsetWidth / 2 - track.clientWidth / 2;
    track.scrollTo({ left: target, behavior: "smooth" });
  }

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

        <div className="relative mt-16 ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] w-screen">
          <div
            ref={trackRef}
            className={cn(
              "flex snap-x snap-mandatory gap-6 overflow-x-auto py-2",
              "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              "before:block before:w-[calc((100vw-84vw)/2)] before:shrink-0 before:content-['']",
              "after:block after:w-[calc((100vw-84vw)/2)] after:shrink-0 after:content-['']",
              "md:before:w-[calc((100vw-min(90vw,1400px))/2)] md:after:w-[calc((100vw-min(90vw,1400px))/2)]",
            )}
          >
            {CARDS.map((card, i) => (
              <div
                key={card.stepLabel}
                ref={(el) => {
                  slideRefs.current[i] = el;
                }}
                className={cn(
                  "relative flex w-[84vw] shrink-0 snap-center flex-col overflow-hidden rounded-[22px] bg-[#0d1420]",
                  "shadow-[0_30px_60px_-30px_rgba(16,23,39,0.35)] transition-[filter] duration-300 ease-out",
                  "aspect-[4/5.6] md:aspect-[16/8.4] md:block md:w-[min(90vw,1400px)] md:rounded-[28px]",
                  i === active ? "filter-none" : "brightness-[0.6] saturate-[0.7]",
                )}
              >
                <div className="relative h-[58%] w-full shrink-0 md:absolute md:inset-0 md:h-full">
                  <Image
                    src={card.src}
                    alt={card.alt}
                    fill
                    className="object-cover"
                    sizes={`(min-width: 1556px) 1400px, (min-width: 768px) 90vw, 84vw`}
                  />
                </div>

                <div
                  className={cn(
                    "relative z-[1] mx-4 -mt-4 mb-4 flex flex-1 flex-col overflow-hidden rounded-2xl border border-[#e3e5e8] bg-white p-4",
                    "md:absolute md:inset-x-auto md:bottom-7 md:left-7 md:mx-0 md:mt-0 md:mb-0 md:h-[46%] md:w-[min(380px,44%)]",
                    "md:rounded-[20px] md:border-white/70 md:bg-white/[0.78] md:p-[18px_22px_14px] md:backdrop-blur-[18px]",
                    "md:shadow-[0_20px_40px_-20px_rgba(16,23,39,0.45)]",
                  )}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-2 -bottom-[34px] hidden text-[120px] leading-none font-extrabold tracking-[-0.04em] text-[#101727] opacity-[0.05] select-none md:block"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <span className="relative z-[1] inline-flex w-fit items-center gap-2 self-start rounded-full bg-brand px-3 py-[7px] text-xs font-extrabold tracking-[0.12em] text-white uppercase">
                    Step {i + 1} of {CARDS.length}
                  </span>
                  <p className="relative z-[1] mt-2.5 line-clamp-2 text-pretty text-[22px] leading-[1.22] font-extrabold tracking-[-0.01em] text-[#101727]">
                    {card.headline}
                  </p>
                  <p className="relative z-[1] mt-1.5 line-clamp-2 text-pretty text-base leading-[1.4] text-[#101727]">
                    {card.copy}
                  </p>
                  <div className="relative z-[1] mt-auto flex items-center justify-between border-t border-[#e3e5e8] pt-2.5">
                    <span className="text-lg font-bold text-[#101727]">
                      {i + 1}: {card.stepLabel}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] mt-7 flex w-screen justify-center">
          <div className="flex w-[calc(100%-48px)] max-w-[min(90vw,1400px)] flex-wrap items-center gap-8">
            <div className="flex min-w-0 flex-1 items-center">
              {CARDS.map((card, i) => (
                <button
                  key={card.stepLabel}
                  type="button"
                  onClick={() => scrollToSlide(i)}
                  className="flex flex-1 flex-col items-start gap-2 bg-transparent py-1.5 text-left"
                >
                  <span
                    className={cn(
                      "text-[15px] font-extrabold transition-colors",
                      i === active ? "text-brand" : "text-[#101727]/[0.16]",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={cn(
                      "h-[3px] w-full rounded-full transition-colors",
                      i === active ? "bg-brand" : "bg-[#101727]/[0.12]",
                    )}
                  />
                  <span
                    className={cn(
                      "max-w-full truncate text-xs font-semibold transition-colors",
                      i === active ? "text-brand" : "text-[#68717D]/70",
                    )}
                  >
                    {card.stepLabel}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex shrink-0 gap-2.5">
              <button
                type="button"
                aria-label="Previous step"
                disabled={active === 0}
                onClick={() => scrollToSlide(Math.max(0, active - 1))}
                className="flex size-12 items-center justify-center rounded-full border border-[#e3e5e8] bg-white text-[#101727] transition-colors hover:enabled:border-[#101727] hover:enabled:bg-[#101727] hover:enabled:text-white disabled:cursor-default disabled:opacity-35"
              >
                <ChevronLeft className="size-[18px]" strokeWidth={2.2} />
              </button>
              <button
                type="button"
                aria-label="Next step"
                disabled={active === CARDS.length - 1}
                onClick={() => scrollToSlide(Math.min(CARDS.length - 1, active + 1))}
                className="flex size-12 items-center justify-center rounded-full border border-[#e3e5e8] bg-white text-[#101727] transition-colors hover:enabled:border-[#101727] hover:enabled:bg-[#101727] hover:enabled:text-white disabled:cursor-default disabled:opacity-35"
              >
                <ChevronRight className="size-[18px]" strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </div>

        <DebriefRecapDemo />
      </div>
    </section>
  );
}
