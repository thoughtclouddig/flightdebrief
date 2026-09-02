import { Check } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { SectionViewEvent } from "@/components/marketing/section-view-event";
import { TrackedLink } from "@/components/marketing/tracked-link";
import { PRICING_TIERS } from "@/lib/marketing/pricing";

/**
 * The homepage shows Pilot and CFI. Not Flight School Pro, and not Enterprise.
 *
 * It used to render all three side by side with an Enterprise panel beneath,
 * which asked a student to compare their own plan against a school plan and a
 * multi-location sales pitch before deciding. Two plans is a different thing
 * from four: the student sees what they pay, and sees that bringing their
 * instructor costs nobody anything.
 *
 * PRICING_TIERS itself is untouched and still holds all three -- /enterprise
 * and /what-is-afterflight read the same data, and the school plan is sold on
 * its own page. Filtered by id rather than sliced so a reordering of the
 * source array cannot silently change which plans a student is shown.
 */
const HOMEPAGE_TIERS = PRICING_TIERS.filter((t) => t.id === "pilot" || t.id === "cfi");
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section id="pricing" className="relative bg-[#f4f5f6] px-6 py-28 sm:py-36">
      <SectionViewEvent event="view_pricing" />
      <div className="mx-auto max-w-[1320px]">
        <Reveal className="text-center">
          <p className="text-balance text-sm font-bold uppercase tracking-[0.16em] text-brand">
            Simple pricing
          </p>
          <h2 className="font-display mt-3 text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
            Get better every flight.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-[#68717D]">
            Start free for your first 3 flights. Your instructor&rsquo;s access is always free.
          </p>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-3xl gap-8 md:grid-cols-2">
          {HOMEPAGE_TIERS.map((tier, i) => (
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
                <p className="text-pretty mt-1.5 text-base text-[#68717D]">{tier.audience}</p>
                <p className="mt-6">
                  <span className="font-display text-[clamp(2.75rem,2rem+3vw,3.75rem)] font-extrabold tracking-tight text-[#101727]">
                    {tier.price}
                  </span>
                  {tier.priceSuffix ? <span className="text-base text-[#68717D]/70">{tier.priceSuffix}</span> : null}
                </p>
                {tier.priceNote ? <p className="text-pretty mt-1 text-base font-semibold text-brand">{tier.priceNote}</p> : null}

                <ul className="mt-8 flex flex-1 flex-col gap-4 border-t border-[#e4e7ea] pt-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="text-pretty flex items-start gap-3 text-base text-[#4b545d]">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/10">
                        <Check className="size-3.5 text-brand" strokeWidth={3} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {tier.valueAnchor ? (
                  <p className="text-pretty mt-5 text-sm font-semibold text-brand">{tier.valueAnchor}</p>
                ) : null}

                <TrackedLink
                  href={tier.signupHref}
                  event={tier.analyticsEvent}
                  className={cn(
                    "mt-9 rounded-xl px-6 py-3.5 text-center text-base font-bold transition-transform hover:scale-[1.02]",
                    tier.featured
                      ? "bg-brand text-white shadow-lg shadow-brand/25 hover:bg-brand-bright hover:text-[#101727]"
                      : "border border-slate-300 text-[#101727] hover:border-[#101727]",
                  )}
                >
                  {tier.cta}
                </TrackedLink>

                {tier.upsell ? (
                  <div className="mt-5 text-balance text-center">
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


      </div>
    </section>
  );
}
