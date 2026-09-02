import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { CtaLink } from "@/components/marketing/cta-link";
import { DebriefSummaryMockupCard } from "@/components/marketing/product-mockups";

// Four, not three. Three left an orphan on the second row of the 2-up grid;
// four fills both rows and reads as a set. "Show up prepared" is the existing
// hero promise restated as a benefit, not a new claim.
//
// Three words each, and that is a constraint rather than a coincidence: the
// grid gives each column about 244px, and the first draft of the fourth
// ("Show up prepared every lesson") was the only one long enough to wrap.
const BENEFITS = [
  "Carry feedback forward",
  "Build proficiency faster",
  "Show up prepared",
  "Waste fewer flight hours",
];

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
            Better training between flights
          </p>
          {/* THREE lines now, and no line may ever hold a single word.
              The orphan rule is the real constraint; "two lines" was a
              property of the old, shorter copy rather than a design choice.

              Re-measured 2026-09-01 for "Get to your checkride sooner — with
              confidence.", which is 46 characters against the old 35. At 60px
              in the 576px column: "sooner — with confidence." is 956px, so a
              two-line split caps the type at 36px -- a third smaller than the
              54px it had. Splitting three ways makes "checkride sooner —" the
              longest line at 718px. That allows 48px exactly -- 572px of a
              576px column -- which is four pixels of margin and would wrap on
              any rendering variance, stranding the dash. Ceiling is 2.875rem
              (46px) for real headroom.

              7vw, not 4.6vw. The first attempt tuned the vw term to reach the
              desktop ceiling and starved the phone -- 4.6vw is 17px at 375,
              so the clamp floor took over and the hero rendered smaller than
              the body copy beneath it. The small end is the binding case:
              "checkride sooner --" allows 22.7px in a 320px screen's column
              and 27.3px at 375, and 7vw lands just under both.

              The old note follows, because the method still applies.
              That rule is what sets the type size, not taste. Measured in the
              real Archivo face, the longest line -- "Make every flight" --
              needs about 10.15px of column per px of type (609px at 60px), so
              any size above column/10.15 wraps it and strands "flight" alone.
              At 3.75rem in a 576px column that is exactly what happened.

              The ends are cut so the longest line fits at every width the
              checklist covers: 3.375rem needs 548px against the 576px desktop
              column, and 1.625rem needs 264px against the 272px column of a
              320px phone. 8vw rather than 5.6vw so the middle range reaches
              full size quickly instead of sitting at the floor on a 375px
              screen.

              Any copy edit here needs re-measuring. A longer first line does
              not merely look tighter -- it silently reintroduces the orphan.

              Measure with font-stretch copied onto the probe span. Omitting it
              renders a narrower synthetic instance and understates Archivo's
              real width by about a fifth. */}
          <h1
            className="font-display mt-4 max-w-2xl text-[clamp(1.375rem,7vw,2.875rem)] font-extrabold leading-[1.0] tracking-[-0.025em] text-[#101727]"
            style={{ textTransform: "none" }}
          >
            Get to your <br />
            checkride sooner &mdash; <br />
            <span className="text-brand">with confidence.</span>
          </h1>
          <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-[#68717D]">
            AfterFlight turns each lesson into a personalized plan for what to review, practice, and focus on
            next &mdash; so you show up prepared, avoid relearning, and build proficiency faster.
          </p>

          {/* Grid, not flex-wrap. Wrapping packed each row by content width, so
              the second column began wherever the first item happened to end
              and none of the four lined up. Two even columns align them. */}
          <ul className="mt-6 grid max-w-xl grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-center gap-1.5 text-sm font-medium text-[#101727]">
                <CheckCircle2 className="size-4 shrink-0 text-brand" />
                {benefit}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-stretch gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CtaLink href="/signup">Try AfterFlight Free</CtaLink>
              <CtaLink href="#overview" variant="secondary" className="whitespace-nowrap">
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
