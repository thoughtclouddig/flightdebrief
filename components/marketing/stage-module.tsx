import type { ReactNode } from "react";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";

/**
 * One module inside a stage band.
 *
 * Not SectionHead: that centers on a max-w-2xl measure, which is correct for a
 * standalone section and wrong inside a stage. Centered heads are what made
 * these read as separate sections in the first place, and the rail holds the
 * left, so a centered head would also sit off the content column's own axis.
 *
 * Sequence is deliberately not numbered. Numerals in the rail and again on
 * every head were chrome doing what the rail's order, active rule and weight
 * already do, and stepped numerals read as generated rather than designed.
 * The rail is the sequence.
 */
export function StageModule({
  id,
  eyebrow,
  headline,
  body,
  children,
  className,
  headlineClassName,
}: {
  id: string;
  eyebrow: string;
  headline: ReactNode;
  body: string;
  children: ReactNode;
  className?: string;
  /**
   * For a headline that states its own line breaks. The 19ch default is the
   * measure that makes a ~41-character headline fall in two lines; a longer
   * one needs either a wider measure or explicit breaks, and explicit breaks
   * need the measure widened or they wrap again inside each stated line.
   */
  headlineClassName?: string;
}) {
  return (
    <article id={id} className={`scroll-mt-28 ${className ?? ""}`}>
      <Reveal>
        {/* The rule yields, not the label.
            
            Both were flex items with default shrink, so on a phone the rule
            held its share and pushed the eyebrow into two lines -- "Two views
            of the same flight" is the longest at 28 characters and it broke.
            shrink-0 on the label plus min-w-0 on the rule inverts that: the
            rule collapses toward zero and the label keeps its one line. At
            320px the label measures ~261px in a 272px column, so it fits with
            the rule fully collapsed. An eyebrow longer than about 28
            characters would overflow instead of wrapping, which is the
            trade -- keep them short. */}
        <div className="flex items-center gap-4">
          <span className="shrink-0 whitespace-nowrap text-xs font-bold uppercase tracking-[0.16em] text-brand">
            {eyebrow}
          </span>
          <span className="h-px min-w-0 flex-1 bg-black/[0.09]" aria-hidden />
        </div>
        <h3
          className={cn(
            "font-display mt-4 max-w-[19ch] text-balance text-3xl font-bold leading-[1.08] text-[#101727] sm:text-[2.25rem]",
            headlineClassName,
          )}
        >
          {headline}
        </h3>
        <p className="mt-4 max-w-[62ch] text-pretty text-lg leading-relaxed text-[#414B57]">{body}</p>
      </Reveal>
      <div className="mt-10">{children}</div>
    </article>
  );
}
