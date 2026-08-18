import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { DebriefSummaryMockupCard } from "@/components/marketing/product-mockups";
import { HeroScoreCard } from "@/components/marketing/hero-score-card";

const BENEFITS = ["Capture every lesson", "Track real progress", "Improve faster"];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pb-20 pt-24 sm:pb-28 sm:pt-28 lg:min-h-[680px] lg:pb-0">
      {/* Desktop: image as a full-height right-aligned panel, fading into the white background on its left edge. */}
      <div className="absolute inset-y-0 right-0 hidden w-[60%] lg:block">
        <Image
          src="/images/marketing/hero-debrief-tablet.webp"
          alt="A student pilot and CFI reviewing a flight debrief together on a tablet beside the aircraft"
          fill
          priority
          className="object-cover"
          sizes="(min-width: 1024px) 1200px, 100vw"
        />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-white/60 via-white/35 to-transparent" />
        <HeroScoreCard className="absolute -bottom-10 right-4 w-[340px] xl:right-8" />
      </div>

      <div className="relative mx-auto max-w-[1320px] px-6">
        <div className="relative z-10 max-w-xl lg:py-16">
          <p className="text-base font-bold uppercase tracking-[0.16em] text-brand sm:text-lg">
            Make every debrief count.
          </p>
          <h1
            className="font-display mt-4 max-w-xl text-balance text-[clamp(2.75rem,6vw,4.25rem)] font-extrabold leading-[0.98] text-[#101727]"
            style={{ textTransform: "none" }}
          >
            Get better <br />
            every <span className="text-brand">flight.</span>
          </h1>
          <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-[#68717D]">
            AfterFlight turns every debrief into clear takeaways, next steps, and real
            progress&mdash;so you fly better and finish your license with confidence.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-center gap-1.5 text-sm font-medium text-[#101727]">
                <CheckCircle2 className="size-4 shrink-0 text-brand" />
                {benefit}
              </li>
            ))}
          </ul>

          <div className="mt-8 inline-flex flex-col items-stretch gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/signup"
                className="rounded-lg bg-brand px-8 py-4 text-center text-base font-semibold text-white hover:bg-brand-dark"
              >
                Start Free
              </Link>
              <Link
                href="#how-it-works"
                className="whitespace-nowrap rounded-lg border border-slate-200 px-8 py-4 text-center text-base font-semibold text-[#101727] hover:bg-[#f4f5f6]"
              >
                See How It Works
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              {["No credit card", "Free to start", "Cancel anytime"].map((item) => (
                <span key={item} className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-[#101727]">
                  <CheckCircle2 className="size-3.5 shrink-0 text-brand" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile/tablet: image as a normal rounded block below the text. The mockup card sits in normal flow
            beneath the photo rather than overlapping it -- on a photo this narrow, the card (sized for a large
            desktop panel) would otherwise cover nearly the entire image. */}
        <div className="relative mt-12 lg:hidden">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl">
            <Image
              src="/images/marketing/hero-debrief-tablet.webp"
              alt="A student pilot and CFI reviewing a flight debrief together on a tablet beside the aircraft"
              fill
              className="object-cover"
              sizes="(max-width: 1023px) 100vw, 0px"
            />
          </div>
          <DebriefSummaryMockupCard className="relative z-10 mx-auto -mt-10 w-[min(320px,88%)] sm:-mt-12" />
        </div>
      </div>
    </section>
  );
}
