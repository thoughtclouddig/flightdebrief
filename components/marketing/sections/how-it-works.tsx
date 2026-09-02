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
/**
 * The four steps, named exactly as the headline names them.
 *
 * These are the headline's words, and they have to stay that way -- an
 * earlier version gave the reader a second set of step names competing with
 * the headline two lines above it, so the section made two claims instead of
 * one. Change one and change the other.
 *
 * The set no longer loops. "Fly. Debrief. Train. Fly again." described a
 * repeating software workflow and literally ended where it started, which is
 * not what a student is buying: they are buying the certificate. Fly -> Learn
 * -> Get Better -> Get Checkride Ready is the same four steps pointed at the
 * outcome, so step four is an arrival rather than a return to step one.
 *
 * Step two is DEBRIEF and stays that way. It was briefly "Learn", which named
 * the outcome; "Debrief" names the thing the student actually does, and every
 * student already knows what one is. That anchors the progression in real
 * flight training rather than in product vocabulary.
 *
 * Step four's label is materially longer than the other three. The progress
 * rail below gives each step flex-1 of the track, so it fits without a layout
 * change, but a fifth step or a longer label would not -- check the rail at
 * 768 before adding either.
 */
const CARDS = [
  {
    label: "Fly",
    headline: "Fly the lesson.",
    copy: "AfterFlight starts with what actually happened in the airplane — the lesson, the objectives, and what you worked on.",
    src: "/images/marketing/how-it-works-fly-a4.avif",
    alt: "A student pilot flying the Cirrus from the left seat, hand on the side-stick, with her instructor beside her in the right seat",
  },
  {
    label: "Debrief",
    headline: "Know what to work on next.",
    copy: "You and your instructor assess the same lesson objectives, then talk through what went well, what needs work, and what should carry forward.",
    src: "/images/marketing/how-it-works-debrief.avif",
    alt: "A student and her instructor going through the flight together on a tablet after landing",
  },
  {
    label: "Get Better",
    headline: "Start where the last flight ended.",
    copy: "Vector turns the debrief into focused practice and preparation before the next lesson.",
    src: "/images/marketing/how-it-works-5.avif",
    alt: "AfterFlight showing an area to improve connected to the FAA Airman Certification Standards",
  },
  {
    label: "Get Checkride Ready",
    headline: "Show up with a plan.",
    copy: "Build proficiency every flight — and get closer to your certificate.",
    src: "/images/marketing/how-it-works-6.avif",
    alt: "AfterFlight showing the three focus areas for a student's next flight",
  },
] as const;

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);

  /*
   * Which slide is active is decided by comparing the track's scroll position
   * against the slide centers.
   *
   * Two earlier versions of this got it wrong, both by depending on something
   * that could silently stop delivering:
   *
   *  - An IntersectionObserver rooted on the track, built once in an effect
   *    with an empty dependency list. The track lives inside `hidden md:block`,
   *    so a first mount at a narrow width gave the root no box, no intersection
   *    ever fired, and `active` stayed pinned at 0 for the life of the page --
   *    the rail never advanced and every inactive card stayed dimmed.
   *  - A rAF-throttled scroll handler guarded by a `frame` flag. If a frame
   *    callback is ever dropped or throttled, the flag stays set and every
   *    subsequent scroll is discarded. It fails in exactly the same way as the
   *    observer: stuck on whatever index it happened to reach.
   *
   * So this version subscribes to nothing that can go stale and holds no state
   * that can latch. Slide centers are measured once per layout and cached, and
   * the scroll handler only reads `scrollLeft` -- no layout reads per event, so
   * there is nothing to throttle in the first place.
   */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let centers: number[] = [];

    const remeasure = () => {
      centers = slideRefs.current.map((slide) => (slide ? slide.offsetLeft + slide.offsetWidth / 2 : NaN));
      pick();
    };

    const pick = () => {
      if (!centers.length) return;
      const center = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let bestDistance = Infinity;
      centers.forEach((slideCentre, i) => {
        const distance = Math.abs(slideCentre - center);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });
      setActive(best);
    };

    remeasure();
    track.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", remeasure);
    return () => {
      track.removeEventListener("scroll", pick);
      window.removeEventListener("resize", remeasure);
    };
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
          size="large"
          headline={
            <>
              {/* Stated break from sm up, where the column can hold each half
                  on one line. Below sm it cannot, so balance handles it. */}
              <span className="sm:block">Fly. Debrief. Get better.</span>{" "}
              <span className="sm:block">Get checkride ready.</span>
            </>
          }
          body="The loop that makes a lesson carry forward. The debrief already happens — AfterFlight is what turns it into training you can actually do before the next one."
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
                  "relative block aspect-[16/8.4] w-[min(90vw,1400px)] shrink-0 snap-center overflow-hidden rounded-2xl bg-[#0d1420]",
                  "shadow-[0_30px_60px_-30px_rgba(16,23,39,0.35)] transition-opacity duration-300 ease-out",
                  i === active ? "opacity-100" : "opacity-[0.88]",
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

                <div className="absolute bottom-7 left-7 z-[1] flex w-[min(520px,60%)] flex-col overflow-hidden rounded-xl border border-white/70 bg-white/[0.78] p-[20px_22px] shadow-[0_20px_40px_-20px_rgba(16,23,39,0.45)] backdrop-blur-[18px]">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-2 -bottom-5 text-[90px] leading-none font-extrabold tracking-[-0.04em] text-[#101727] opacity-[0.05] select-none"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <span className="relative z-[1] inline-flex w-fit items-center gap-2 self-start rounded-full bg-brand px-3 py-[7px] text-xs font-extrabold tracking-[0.12em] text-white uppercase">
                    Step {i + 1}: {card.label}
                  </span>
                  {/*
                   * Sized so every headline sits on ONE line at every width
                   * this carousel is shown at -- it is hidden below md.
                   *
                   * The longest is "Start where the last flight ended." It
                   * costs about 18.9px of width per px of type, so 23px wants
                   * 434px and the card has to carry that -- hence the width
                   * below as well as the size here.
                   *
                   * The vw term is what took two passes. At 1.4vw the type
                   * only reached its 22px ceiling at a 1570px viewport, so a
                   * normal desktop got 19px and the headlines read small. 2.4vw
                   * hits the ceiling around 950px, which is where the card
                   * stops growing anyway. Measure before adding a longer
                   * headline.
                   */}
                  <p className="relative z-[1] mt-3 text-pretty text-[clamp(17.5px,2.4vw,23px)] leading-[1.25] font-extrabold tracking-[-0.01em] text-[#101727]">
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
                      "text-[17px] font-extrabold tabular-nums transition-colors",
                      i === active ? "text-brand" : "text-[#101727]/30",
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
                      // 15px, not 12px, and full-strength ink rather than a
                      // 70%-opacity gray. These four words are the page's
                      // mental model; at text-xs they read as a caption on the
                      // carousel instead of the model itself.
                      "max-w-full truncate text-[15px] font-bold transition-colors",
                      i === active ? "text-brand" : "text-[#68717D]",
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
