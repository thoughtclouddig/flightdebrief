import Link from "next/link";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { CtaLink } from "@/components/marketing/cta-link";
import { DebriefSummaryMockupCard } from "@/components/marketing/product-mockups";

const BENEFITS = ["Understand what mattered", "Train the weak spots", "Show up ready for what's next"];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-24 sm:pt-28 lg:min-h-[680px] lg:pb-0">
      <div className="relative mx-auto max-w-[1320px] px-6">
        <div className="relative z-10 max-w-xl lg:py-16">
          <p className="text-balance text-base font-bold uppercase tracking-[0.16em] text-brand sm:text-lg">
            Your flight doesn&rsquo;t stop teaching at shutdown.
          </p>
          <h1
            className="font-display mt-4 max-w-xl text-balance text-[clamp(2.5rem,5.4vw,3.9rem)] font-extrabold leading-[0.98] text-[#101727]"
            style={{ textTransform: "none" }}
          >
            Get more out of <br />
            every flight <span className="text-brand">lesson.</span>
          </h1>
          <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-[#68717D]">
            AfterFlight turns your instructor debrief into personalized training, quick practice,
            and a clear plan for what to work on before your next flight.
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
              <CtaLink href="/signup">Start Free</CtaLink>
              <CtaLink href="#how-it-works" variant="secondary" className="whitespace-nowrap">
                See How It Works
              </CtaLink>
            </div>

            {/* The recording claim links to the page that backs it. Its value
                is that it survives being checked, so it should be one click
                from the assertion rather than buried in the footer. */}
            <p className="text-balance text-center text-sm font-medium text-[#68717D] sm:text-left">
              No credit card &middot; Free to start &middot;{" "}
              <Link href="/data-handling" className="underline underline-offset-2 hover:text-[#101727]">
                Nothing you say is stored as a recording
              </Link>
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
