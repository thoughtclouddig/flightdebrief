import type { ReactNode } from "react";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";

/**
 * The homepage's standard section opening: brand eyebrow, display headline,
 * one supporting line.
 *
 * Extracted because the repositioning pass added seven new sections, and seven
 * hand-copied versions of the same three elements is how a page starts drifting
 * into seven slightly different typographic systems.
 */
/**
 * `size="large"` is for a headline that IS the idea rather than a label for the
 * section beneath it -- currently only the product loop. The upper bound is
 * measured, not chosen: "Fly. Debrief. Train." needs ~10.1px of column per px
 * of type, so 3.75rem wants 611px and the container gives 672px on desktop but
 * only 592px at the `sm` breakpoint. A flat sm:text-6xl overflows there and
 * breaks the line a third time, which is how "again." ends up alone. The vw
 * term keeps it inside the column at every width in between.
 */
export function SectionHead({
  eyebrow,
  headline,
  body,
  className,
  size = "default",
}: {
  eyebrow: string;
  headline: ReactNode;
  body?: ReactNode;
  className?: string;
  size?: "default" | "large";
}) {
  return (
    <Reveal className={cn("mx-auto max-w-2xl text-center", className)}>
      <p className="text-balance text-lg font-bold uppercase tracking-[0.16em] text-brand sm:text-xl">{eyebrow}</p>
      <h2
        className={cn(
          "font-display mt-3 text-balance text-4xl font-bold text-[#101727]",
          size === "large" ? "sm:text-[clamp(3rem,6vw,3.75rem)]" : "sm:text-5xl",
        )}
      >
        {headline}
      </h2>
      {body ? <p className="mt-4 text-balance text-lg leading-relaxed text-[#68717D]">{body}</p> : null}
    </Reveal>
  );
}
