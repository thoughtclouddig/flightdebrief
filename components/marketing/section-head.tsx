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
          "font-display mt-3 text-balance font-bold text-[#101727]",
          // The note above fixed this at the sm breakpoint and left the phone
          // on a flat text-4xl, which held until a headline got longer. "Get
          // checkride ready." is 430px at 36px and the column is 327px, so it
          // broke a fourth time and stranded "ready." -- the same failure the
          // note describes, one breakpoint down. A clamp at both ends now.
          size === "large"
            ? "text-[clamp(1.6rem,7vw,2.25rem)] sm:text-[clamp(3rem,6vw,3.75rem)]"
            : "text-4xl sm:text-5xl",
        )}
      >
        {headline}
      </h2>
      {/*
       * Short bodies balance; long ones do not.
       *
       * text-pretty evens out line lengths, which is what a two or three line
       * standfirst wants -- but browsers stop balancing past roughly six lines
       * and fall back to normal wrapping, which strands the last line.
       *
       * "Long" is not a property of the string, though: the same 230 characters
       * are seven lines at 375 and three at 1440. So it is both -- length picks
       * which bodies need help, and the breakpoint picks where. Long bodies get
       * pretty on a phone and balance once the measure is wide enough to make
       * two or three even lines.
       */}
      {body ? (
        <p
          className={cn(
            "mt-4 text-lg leading-relaxed text-[#68717D]",
            typeof body === "string" && body.length > 150 ? "text-pretty sm:text-balance" : "text-balance",
          )}
        >
          {body}
        </p>
      ) : null}
    </Reveal>
  );
}
