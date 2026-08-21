import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { DebriefSummaryMockupCard } from "@/components/marketing/product-mockups";

const BENEFITS = ["Capture every lesson", "Track real progress", "Improve faster"];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-24 sm:pt-28 lg:min-h-[680px] lg:pb-0">
      <div className="relative mx-auto max-w-[1320px] px-6">
        <div className="relative z-10 max-w-xl lg:py-16">
          <p className="text-balance text-base font-bold uppercase tracking-[0.16em] text-brand sm:text-lg">
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

          <div className="mt-8 flex flex-col items-stretch gap-3">
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

            <p className="text-balance text-center text-sm font-medium text-[#68717D] sm:text-left">
              No credit card &middot; Free to start &middot; Cancel anytime
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
        <DebriefSummaryMockupCard className="absolute -bottom-20 left-1/2 z-10 w-[min(320px,88%)] -translate-x-1/2 lg:hidden" />
      </div>
      <div className="h-24 lg:hidden" aria-hidden="true" />
    </section>
  );
}
