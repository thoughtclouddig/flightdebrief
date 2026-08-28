import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { SectionViewEvent } from "@/components/marketing/section-view-event";
import { TrackedLink } from "@/components/marketing/tracked-link";
import { PRICING_TIERS, ENTERPRISE_PRICING } from "@/lib/marketing/pricing";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section id="pricing" className="relative bg-[#f4f5f6] px-6 py-28 sm:py-36">
      <SectionViewEvent event="view_pricing" />
      <div className="mx-auto max-w-[1320px]">
        <Reveal className="text-center">
          <p className="text-balance text-sm font-bold uppercase tracking-[0.16em] text-brand">
            Built for Every Part of Flight Training.
          </p>
          <h2 className="font-display mt-3 text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
            Get better every flight.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-balance text-[#68717D]">
            Start as a pilot or CFI. Bring AfterFlight to your entire school when you&rsquo;re ready.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {PRICING_TIERS.map((tier, i) => (
            <Reveal key={tier.id} delay={i * 100}>
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-3xl border bg-white p-10 transition-shadow",
                  tier.featured
                    ? "border-brand shadow-[0_2px_4px_rgba(16,23,39,0.04),0_32px_64px_-24px_rgba(240,118,33,0.28)] lg:-translate-y-3"
                    : "border-slate-200 shadow-[0_2px_4px_rgba(16,23,39,0.03),0_16px_40px_-20px_rgba(16,23,39,0.14)]",
                )}
              >
                {tier.featured ? (
                  <span className="absolute inset-x-0 top-0 mx-auto inline-block w-fit -translate-y-1/2 rounded-full bg-brand px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-brand/30">
                    {tier.featuredLabel}
                  </span>
                ) : null}
                <p className={cn("text-balance font-display text-lg font-bold uppercase tracking-wide text-[#101727]", tier.featured && "mt-2")}>
                  {tier.name}
                </p>
                <p className="text-balance mt-1.5 text-base text-[#68717D]">{tier.audience}</p>
                <p className="mt-6">
                  <span className="font-display text-[clamp(2.75rem,2rem+3vw,3.75rem)] font-extrabold tracking-tight text-[#101727]">
                    {tier.price}
                  </span>
                  {tier.priceSuffix ? <span className="text-base text-[#68717D]/70">{tier.priceSuffix}</span> : null}
                </p>
                {tier.priceNote ? <p className="text-balance mt-1 text-base font-semibold text-brand">{tier.priceNote}</p> : null}

                <ul className="mt-8 flex flex-1 flex-col gap-4 border-t border-[#e4e7ea] pt-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="text-balance flex items-start gap-3 text-base text-[#4b545d]">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/10">
                        <Check className="size-3.5 text-brand" strokeWidth={3} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {tier.valueAnchor ? (
                  <p className="text-balance mt-5 text-sm font-semibold text-brand">{tier.valueAnchor}</p>
                ) : null}

                <TrackedLink
                  href={tier.signupHref}
                  event={tier.analyticsEvent}
                  className={cn(
                    "mt-9 rounded-xl px-6 py-3.5 text-center text-base font-bold transition-transform hover:scale-[1.02]",
                    tier.featured
                      ? "bg-brand text-white shadow-lg shadow-brand/25 hover:bg-brand-bright"
                      : "border border-slate-300 text-[#101727] hover:border-[#101727]",
                  )}
                >
                  {tier.cta}
                </TrackedLink>

                {tier.upsell ? (
                  <div className="mt-5 text-pretty text-center">
                    <p className="text-sm text-[#68717D]">{tier.upsell.text}</p>
                    <a
                      href={tier.upsell.href}
                      className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline"
                    >
                      {tier.upsell.linkLabel} &rarr;
                    </a>
                  </div>
                ) : null}
              </div>
            </Reveal>
          ))}
        </div>


        <Reveal delay={300}>
          <div
            id="enterprise"
            className="relative mt-10 overflow-hidden rounded-2xl bg-[#101727] px-8 py-10 sm:px-12 sm:py-12"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#171f33_0%,_#0c1220_75%)]" />

            <div className="relative grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-16">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">{ENTERPRISE_PRICING.eyebrow}</p>
                <h3 className="font-display mt-3 text-balance text-3xl font-bold text-white sm:text-4xl">
                  {ENTERPRISE_PRICING.sectionHeadlineLine1}
                  <br />
                  {ENTERPRISE_PRICING.sectionHeadlineLine2}
                </h3>
                <p className="mt-4 max-w-md text-pretty text-white/70">{ENTERPRISE_PRICING.sectionCopy}</p>
                <p className="text-balance mt-6 font-display text-xl font-bold text-white">{ENTERPRISE_PRICING.sectionPriceLabel}</p>

                <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <TrackedLink
                    href={ENTERPRISE_PRICING.ctaHref}
                    event="select_enterprise"
                    className="group inline-flex items-center gap-2.5 rounded-lg bg-brand px-8 py-4 text-base font-bold text-white transition-[transform,box-shadow,background-color] duration-150 ease-out hover:-translate-y-0.5 hover:bg-brand-bright hover:shadow-lg hover:shadow-brand/25 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    {ENTERPRISE_PRICING.cta}
                    <ArrowRight className="size-5 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
                  </TrackedLink>
                </div>
                <p className="mt-5 max-w-md text-pretty text-sm text-white/60">{ENTERPRISE_PRICING.sectionSupportingLine}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ENTERPRISE_PRICING.capabilityTiles.map((tile) => (
                  <div key={tile.title} className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                    <span className="block h-0.5 w-6 bg-brand" aria-hidden="true" />
                    <p className="text-balance mt-3 text-sm font-bold uppercase tracking-wide text-white">{tile.title}</p>
                    <p className="mt-1.5 text-pretty text-[13px] leading-relaxed text-white/55">{tile.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
