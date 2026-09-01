import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { CtaLink } from "@/components/marketing/cta-link";
import { DebriefSummaryMockupCard } from "@/components/marketing/product-mockups";

const BENEFITS = ["Carry feedback forward", "Build proficiency faster", "Waste fewer flight hours"];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-24 sm:pt-28 lg:min-h-[680px] lg:pb-0">
      <div className="relative mx-auto max-w-[1320px] px-6">
        <div className="relative z-10 max-w-xl lg:py-16">
          {/* One line, and sized by measurement rather than by eye. Uppercase
              at 0.16em tracking, this string renders 630px wide at 18px
              against a 576px column, so it wrapped. 15px puts it at ~525px --
              about 50px of slack, which is enough to survive the fallback face
              before Archivo loads. It still wraps below sm, where no readable
              size fits 45 characters on a phone. */}
          <p className="text-balance text-[15px] font-bold uppercase tracking-[0.16em] text-brand">
            Better flight training starts between flights
          </p>
          {/* Three lines, fixed. The breaks are explicit rather than left to
              text-balance because the display face is wide enough that a line
              wraps on its own at this size, turning a three-line headline into
              four and pushing the CTA below the fold. Negative tracking buys
              the width that costs.

              Both clamp ends are set by the longest line rather than by eye.
              Measured in the real Archivo face, "Show up ready" renders 600px
              wide at 68px -- so it needs roughly 8.8px of column per px of
              type. Against the 576px desktop column that caps the headline at
              ~65px (3.75rem, 60px, leaves ~50px of slack); against the 327px
              column on a 375px phone it caps at ~37px (2.125rem, 34px, ~27px
              of slack). At the previous 4.25rem/2.75rem the line overflowed at
              both ends and the headline broke to four lines on desktop and
              five on mobile, which is what pushed the CTA under the fold.

              Measure with font-stretch copied onto the probe span. Omitting it
              renders the probe in a narrower synthetic instance and
              understates Archivo's real width by about a fifth.

              The promise is continuity, not capture: what the student buys is
              arriving at the next lesson already prepared. "Lesson" carries the
              brand color because the next lesson is the thing this product is
              about -- not the flight that just ended. */}
          <h1
            className="font-display mt-4 max-w-2xl text-[clamp(2.125rem,5.6vw,3.75rem)] font-extrabold leading-[1.0] tracking-[-0.025em] text-[#101727]"
            style={{ textTransform: "none" }}
          >
            Show up ready <br />
            for your next <br />
            <span className="text-brand">lesson.</span>
          </h1>
          <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-[#68717D]">
            AfterFlight connects every flight with your instructor&rsquo;s feedback and personalized training, so
            you show up better prepared, build proficiency faster, and waste fewer expensive flight hours.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-center gap-1.5 text-sm font-medium text-[#101727]">
                <CheckCircle2 className="size-4 shrink-0 text-brand" />
                {benefit}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-stretch gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CtaLink href="/signup">Start Your First Flight</CtaLink>
              <CtaLink href="#how-it-works" variant="secondary" className="whitespace-nowrap">
                See How It Works
              </CtaLink>
            </div>

            {/* The recording claim used to sit here, wrapped under the CTA
                where it read as fine print on the price. It now lives beside
                the recorder itself, in the Debrief Replay section, which is
                where someone is actually wondering about it. */}
            <p className="text-balance text-center text-sm font-medium text-[#68717D] sm:text-left">
              No credit card &middot; Free to start
            </p>
          </div>
        </div>

      </div>

      {/* One responsive hero image serves both layouts, avoiding an eager hidden desktop duplicate on mobile. */}
      <div className="relative mx-6 mt-12 aspect-[4/3] overflow-visible lg:absolute lg:inset-y-0 lg:right-0 lg:mx-0 lg:mt-0 lg:w-[60%] lg:aspect-auto">
        <div className="absolute inset-0 overflow-hidden rounded-3xl lg:rounded-none">
          <Image
            src="/images/marketing/hero-debrief-tablet.webp"
            alt="A student pilot and CFI reviewing a flight debrief together on a tablet beside the aircraft"
            fill
            priority
            className="object-cover"
            sizes="(min-width: 1024px) 60vw, 100vw"
          />
          <div className="absolute inset-y-0 left-0 hidden w-1/2 bg-gradient-to-r from-white/60 via-white/35 to-transparent lg:block" />
        </div>
        <DebriefSummaryMockupCard className="absolute -bottom-10 right-4 hidden w-[340px] lg:block xl:right-8" />
      </div>
      {/* In normal flow (not absolute) on mobile so the card's real height sets the
          section's height -- an absolutely-positioned card here previously needed a
          hardcoded spacer below it that never matched the card's actual content height. */}
      <DebriefSummaryMockupCard className="relative z-10 -mt-16 mx-auto mb-10 w-[min(320px,88%)] lg:hidden" />
    </section>
  );
}
