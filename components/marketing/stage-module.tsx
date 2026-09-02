import type { ReactNode } from "react";
import { Reveal } from "@/components/marketing/reveal";

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
}: {
  id: string;
  eyebrow: string;
  headline: ReactNode;
  body: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article id={id} className={`scroll-mt-28 ${className ?? ""}`}>
      <Reveal>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand">{eyebrow}</span>
          <span className="h-px flex-1 bg-black/[0.09]" aria-hidden />
        </div>
        <h3 className="font-display mt-4 max-w-[19ch] text-balance text-3xl font-bold leading-[1.08] text-[#101727] sm:text-[2.25rem]">
          {headline}
        </h3>
        <p className="mt-4 max-w-[62ch] text-pretty text-lg leading-relaxed text-[#414B57]">{body}</p>
      </Reveal>
      <div className="mt-10">{children}</div>
    </article>
  );
}
