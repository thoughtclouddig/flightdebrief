"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { PhotoVisual } from "@/components/marketing/app-screen";
import { SectionHead } from "@/components/marketing/section-head";
import { cn } from "@/lib/utils";

/**
 * The learning loop, in four steps, in the full-bleed sliding cards.
 *
 * Replaces the six-card sequence that walked through CFI assessment, student
 * assessment, recording, summary, recap and next lesson. That sequence was an
 * accurate description of the workflow and the wrong thing to lead with: it
 * read as a training-records product, with the debrief as the whole point.
 * The debrief is the INPUT. What the student buys is what happens after it.
 *
 * The carousel mechanics are kept from that version -- the active slide is
 * centered rather than start-aligned so both neighbors peek, and the track
 * plus its controls break out to full viewport width, since the active slide
 * (min(90vw,1400px)) is wider than the section's own container.
 */
const CARDS = [
  {
    label: "Debrief",
    headline: "Your instructor talks through the flight.",
    copy: "The way they normally do. No forms, no grading grid, no extra work for either of you.",
    src: "/images/marketing/how-it-works-3.avif",
    alt: "A CFI and student pilot recording a debrief together in AfterFlight after a training flight",
  },
  {
    label: "Understand",
    headline: "AfterFlight sorts out what mattered.",
    copy: "What went well, what still needs work, and where your read of the flight differs from your instructor's.",
    src: "/images/marketing/how-it-works-4.avif",
    alt: "AfterFlight showing a flight summary organized into what went well and what needs work",
  },
  {
    label: "Train with Vector",
    headline: "Work the weak spots before you fly again.",
    copy: "Vector explains what your instructor meant, checks your understanding, and rehearses the parts you're still getting wrong.",
    src: "/images/marketing/how-it-works-5.avif",
    alt: "AfterFlight showing an area to improve connected to the FAA Airman Certification Standards",
  },
  {
    label: "Fly prepared",
    headline: "Show up knowing what you're there to fix.",
    copy: "A short list of things to study, remember and practice — before you spend money on the next hour.",
    src: "/images/marketing/how-it-works-6.avif",
    alt: "AfterFlight showing the three focus areas for a student's next flight",
  },
] as const;

export function HowItWorks() {
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
    track.scrollTo({ left: slide.offsetLeft + slide.offsetWidth / 2 - track.clientWidth / 2, behavior: "smooth" });
  }

  return (
    <section id="how-it-works" className="bg-[#f4f5f6] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1320px]">
        <SectionHead
          eyebrow="How it works"
          headline="One flight, four steps, no wasted lesson."
          body="The debrief already happens. AfterFlight is what turns it into something you can actually train against."
        />

        {/* Mobile: the peeking-card slider's density (translucent overlay card,
            ghost numeral, condensed progress rail) doesn't survive a narrow
            viewport -- labels and copy collide. Below md, fall back to a plain
            stacked list instead of fighting the layout. */}
        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 md:hidden">
          {CARDS.map((card, i) => (
            <Reveal key={card.label} delay={(i % 3) * 100} className="flex flex-col gap-4">
              <PhotoVisual src={card.src} alt={card.alt} label={`Step ${i + 1}: ${card.label}`} />
              <div>
                <p className="font-display text-balance text-xl font-bold text-[#101727]">{card.headline}</p>
                <p className="text-pretty mt-2 text-base leading-relaxed text-[#68717D]">{card.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="relative mt-16 ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] hidden w-screen md:block">
          <div
            ref={trackRef}
            className={cn(
              "flex snap-x snap-mandatory gap-6 overflow-x-auto py-2",
              "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              "before:block before:w-[calc((100vw-min(90vw,1400px))/2)] before:shrink-0 before:content-['']",
              "after:block after:w-[calc((100vw-min(90vw,1400px))/2)] after:shrink-0 after:content-['']",
            )}
          >
            {CARDS.map((card, i) => (
              <div
                key={card.label}
                ref={(el) => {
                  slideRefs.current[i] = el;
                }}
                className={cn(
                  "relative block aspect-[16/8.4] w-[min(90vw,1400px)] shrink-0 snap-center overflow-hidden rounded-[28px] bg-[#0d1420]",
                  "shadow-[0_30px_60px_-30px_rgba(16,23,39,0.35)] transition-[filter] duration-300 ease-out",
                  i === active ? "filter-none" : "brightness-[0.6] saturate-[0.7]",
                )}
              >
                <div className="absolute inset-0 h-full w-full">
                  <Image
                    src={card.src}
                    alt={card.alt}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1556px) 1400px, 90vw"
                  />
                </div>

                <div className="absolute bottom-7 left-7 z-[1] flex w-[min(380px,44%)] flex-col overflow-hidden rounded-[20px] border border-white/70 bg-white/[0.78] p-[20px_22px] shadow-[0_20px_40px_-20px_rgba(16,23,39,0.45)] backdrop-blur-[18px]">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-2 -bottom-5 text-[90px] leading-none font-extrabold tracking-[-0.04em] text-[#101727] opacity-[0.05] select-none"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <span className="relative z-[1] inline-flex w-fit items-center gap-2 self-start rounded-full bg-brand px-3 py-[7px] text-xs font-extrabold tracking-[0.12em] text-white uppercase">
                    Step {i + 1}: {card.label}
                  </span>
                  <p className="relative z-[1] mt-3 text-balance text-[22px] leading-[1.25] font-extrabold tracking-[-0.01em] text-[#101727]">
                    {card.headline}
                  </p>
                  <p className="relative z-[1] mt-2 text-pretty text-base leading-[1.4] text-[#101727]">{card.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] mt-7 hidden w-screen justify-center md:flex">
          <div className="flex w-[calc(100%-48px)] max-w-[min(90vw,1400px)] items-center gap-8">
            <div className="flex min-w-0 flex-1 items-center">
              {CARDS.map((card, i) => (
                <button
                  key={card.label}
                  type="button"
                  onClick={() => scrollToSlide(i)}
                  className="flex flex-1 cursor-pointer flex-col items-start gap-2 bg-transparent py-1.5 text-left"
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
                    {card.label}
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
                className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-[#e3e5e8] bg-white text-[#101727] transition-colors hover:enabled:border-[#101727] hover:enabled:bg-[#101727] hover:enabled:text-white disabled:cursor-default disabled:opacity-35"
              >
                <ChevronLeft className="size-[18px]" strokeWidth={2.2} aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Next step"
                disabled={active === CARDS.length - 1}
                onClick={() => scrollToSlide(Math.min(CARDS.length - 1, active + 1))}
                className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-[#e3e5e8] bg-white text-[#101727] transition-colors hover:enabled:border-[#101727] hover:enabled:bg-[#101727] hover:enabled:text-white disabled:cursor-default disabled:opacity-35"
              >
                <ChevronRight className="size-[18px]" strokeWidth={2.2} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
