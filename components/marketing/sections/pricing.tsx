"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { PRICING_TIERS, ENTERPRISE_PRICING } from "@/lib/marketing/pricing";
import { trackEvent } from "@/lib/marketing/analytics";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section id="pricing" className="bg-[#f4f5f6] px-6 py-28 sm:py-36" onMouseEnter={() => trackEvent("view_pricing")}>
      <div className="mx-auto max-w-[1320px]">
        <Reveal className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">Simple Pricing. Big Value.</p>
          <h2 className="font-display mt-3 text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
            Choose the plan that fits you.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PRICING_TIERS.map((tier, i) => (
            <Reveal key={tier.id} delay={i * 100}>
              <div
                className={cn(
                  "flex h-full flex-col rounded-2xl border bg-white p-8",
                  tier.featured ? "border-brand shadow-lg shadow-brand/10" : "border-slate-200",
                )}
              >
                {tier.featured ? (
                  <span className="mb-4 inline-block w-fit rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    {tier.featuredLabel}
                  </span>
                ) : null}
                <p className="font-display text-lg font-bold uppercase tracking-wide text-[#101727]">{tier.name}</p>
                <p className="mt-1 text-sm text-[#68717D]">{tier.audience}</p>
                <p className="mt-5">
                  <span className="font-display text-4xl font-bold text-[#101727]">{tier.price}</span>
                  {tier.priceSuffix ? <span className="text-sm text-[#68717D]/70">{tier.priceSuffix}</span> : null}
                </p>
                {tier.priceNote ? <p className="mt-1 text-sm font-medium text-brand">{tier.priceNote}</p> : null}

                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-base text-[#68717D]">
                      <Check className="mt-0.5 size-5 shrink-0 text-brand" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.signupHref}
                  onClick={() => trackEvent(tier.analyticsEvent)}
                  className={cn(
                    "mt-8 rounded-lg px-6 py-3 text-center text-sm font-semibold",
                    tier.featured
                      ? "bg-brand text-white hover:bg-brand-dark"
                      : "border border-slate-200 text-[#101727] hover:bg-[#f4f5f6]",
                  )}
                >
                  {tier.cta}
                </Link>

                {tier.upsell ? (
                  <p className="mt-4 text-pretty text-center text-xs text-[#68717D]">
                    {tier.upsell.text}{" "}
                    <a href={tier.upsell.href} className="font-semibold text-brand hover:underline">
                      {tier.upsell.linkLabel} &rarr;
                    </a>
                  </p>
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

            <div className="relative grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">{ENTERPRISE_PRICING.eyebrow}</p>
                <h3 className="font-display mt-3 text-balance text-3xl font-bold text-white sm:text-4xl">
                  {ENTERPRISE_PRICING.headline}
                </h3>
                <p className="mt-4 max-w-md text-pretty text-white/70">{ENTERPRISE_PRICING.copy}</p>
                <p className="mt-6 font-display text-xl font-bold text-white">{ENTERPRISE_PRICING.priceLabel}</p>

                <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <Link
                    href={ENTERPRISE_PRICING.ctaHref}
                    onClick={() => trackEvent("select_enterprise")}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
                  >
                    {ENTERPRISE_PRICING.cta}
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
                <p className="mt-5 max-w-md text-pretty text-xs text-white/50">{ENTERPRISE_PRICING.supportingLine}</p>
              </div>

              <ul className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                {ENTERPRISE_PRICING.capabilities.map((capability) => (
                  <li key={capability} className="flex items-start gap-2.5 text-base text-white/80">
                    <Check className="mt-0.5 size-5 shrink-0 text-brand" />
                    {capability}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
