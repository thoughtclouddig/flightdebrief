import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { INSTRUCTOR, NEXT_LESSON, STRUCTURED, STUDENT } from "@/lib/prototype/vector-data";

export const metadata: Metadata = { title: "Home — AfterFlight", robots: { index: false, follow: false } };

/**
 * Home answers exactly one question: what should I do before I fly again?
 *
 * Everything that is not an answer to that question has moved to Train,
 * Debrief or Progress. The previous version showed every capability at once
 * in a flat stack of equal-weight cards, which is why it read as a long page
 * instead of a product -- there was nothing to look at first.
 *
 * Above the fold: who, when, the two things that matter, one quote from the
 * instructor, one primary action.
 */
export default function PrototypeHome() {
  return (
    <div className="flex flex-col gap-6 px-5 pt-6">
      <div>
        <p className="text-sm text-foreground-faint">Good afternoon</p>
        <h1 className="text-[32px] font-semibold leading-none tracking-tight text-foreground">{STUDENT.firstName}</h1>
      </div>

      {/* The one card that matters. Visually dominant on purpose. */}
      <section className="rounded-2xl bg-brand p-5 text-brand-foreground">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">Next flight</p>
        <p className="mt-1.5 text-2xl font-semibold leading-tight">
          {NEXT_LESSON.date} &middot; {NEXT_LESSON.time}
        </p>
        <p className="mt-1 text-sm opacity-85">
          {INSTRUCTOR.firstName} &middot; Crosswind / Short Field
        </p>
      </section>

      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-faint">Focus on 2 things</h2>
        <div className="mt-3 flex flex-col gap-2.5">
          {STRUCTURED.nextFlightFocus.map((f, i) => (
            <div key={f} className="flex items-center gap-3 rounded-xl border border-hairline px-4 py-3.5">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-xs font-semibold tabular-nums text-foreground-soft">
                {i + 1}
              </span>
              <span className="text-[15px] font-medium text-foreground">{f}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-faint">
          {INSTRUCTOR.firstName}&rsquo;s key reminder
        </h2>
        <blockquote className="mt-3 border-l-2 border-brand pl-4 text-[15px] italic leading-relaxed text-foreground-soft">
          &ldquo;{STRUCTURED.instructorEmphasis[0]!.quote}&rdquo;
        </blockquote>
      </section>

      {/* One obvious action. */}
      <Link
        href="/prototype/vector/train"
        className="flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-4 text-[15px] font-semibold text-surface"
      >
        Train with Vector
        <ArrowRight className="size-4" />
      </Link>

      <div className="flex flex-col">
        <SecondaryLink href="/prototype/vector/debrief" label="Review last debrief" meta="Aug 29" />
        <SecondaryLink href="/prototype/vector/progress" label="See progress" meta="4 skills" />
      </div>
    </div>
  );
}

function SecondaryLink({ href, label, meta }: { href: string; label: string; meta: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 border-b border-hairline py-4 last:border-b-0">
      <span className="flex-1 text-[15px] text-foreground">{label}</span>
      <span className="text-sm text-foreground-faint">{meta}</span>
      <ChevronRight className="size-4 text-foreground-faint" />
    </Link>
  );
}
