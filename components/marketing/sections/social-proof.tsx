import { Reveal } from "@/components/marketing/reveal";
import { SOCIAL_PROOF_QUOTE, SOCIAL_PROOF_STATS } from "@/lib/marketing/social-proof";

export function SocialProof() {
  return (
    <section className="border-t border-hairline px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Why this matters</p>
          <h2 className="font-display mt-3 text-balance text-3xl font-extrabold uppercase leading-[1.02] text-foreground sm:text-4xl">
            Most student pilots don&rsquo;t quit over money.
          </h2>
        </Reveal>

        <Reveal delay={100} className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SOCIAL_PROOF_STATS.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-hairline bg-surface p-5">
              <p className="font-display text-4xl font-extrabold text-foreground">{stat.value}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground-soft">{stat.label}</p>
              <a
                href={stat.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-xs text-foreground-faint hover:text-brand hover:underline"
              >
                {stat.sourceLabel}
              </a>
            </div>
          ))}
        </Reveal>

        <Reveal delay={200} className="mt-8 border-l-2 border-brand/40 pl-5">
          <p className="text-pretty text-lg italic leading-relaxed text-foreground-soft">
            &ldquo;{SOCIAL_PROOF_QUOTE.text}&rdquo;
          </p>
          <a
            href={SOCIAL_PROOF_QUOTE.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-xs text-foreground-faint hover:text-brand hover:underline"
          >
            — {SOCIAL_PROOF_QUOTE.sourceLabel}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
