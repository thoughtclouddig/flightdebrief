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
export function SectionHead({
  eyebrow,
  headline,
  body,
  className,
}: {
  eyebrow: string;
  headline: ReactNode;
  body?: ReactNode;
  className?: string;
}) {
  return (
    <Reveal className={cn("mx-auto max-w-2xl text-center", className)}>
      <p className="text-balance text-lg font-bold uppercase tracking-[0.16em] text-brand sm:text-xl">{eyebrow}</p>
      <h2 className="font-display mt-3 text-balance text-4xl font-bold text-[#101727] sm:text-5xl">{headline}</h2>
      {body ? <p className="mt-4 text-balance text-lg leading-relaxed text-[#68717D]">{body}</p> : null}
    </Reveal>
  );
}
