import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, Plane } from "lucide-react";
import { Evidence, PageTitle, PrimaryButton, PrimaryCard, Screen, Section, SectionLabel } from "@/components/prototype/ui";
import { INSTRUCTOR, NEXT_LESSON, STRUCTURED, STUDENT } from "@/lib/prototype/vector-data";

export const metadata: Metadata = { title: "Home — AfterFlight", robots: { index: false, follow: false } };

/**
 * Home answers one question: what should I do before I fly again?
 *
 * The Next Flight card is dark with an orange edge rather than a full orange
 * slab. The slab was the loudest thing on screen and it was not the thing to
 * tap, which left the actual primary action looking secondary.
 */
export default function PrototypeHome() {
  return (
    <Screen>
      <PageTitle kicker="Good afternoon">{STUDENT.firstName}</PageTitle>

      <PrimaryCard>
        <div className="flex items-center gap-1.5 text-brand">
          <Plane className="size-3.5" />
          <span className="text-[13px] font-semibold uppercase tracking-[0.1em]">Next flight</span>
        </div>
        <p className="mt-2 text-[28px] font-semibold leading-tight tracking-tight">
          {NEXT_LESSON.date} · {NEXT_LESSON.time}
        </p>
        <p className="mt-1 text-[15px] opacity-70">
          {INSTRUCTOR.firstName} · Crosswind + Short Field
        </p>
      </PrimaryCard>

      <Section>
        <SectionLabel>Focus on 2 things</SectionLabel>
        <div className="flex flex-col">
          {STRUCTURED.nextFlightFocus.map((f, i) => (
            <div key={f} className="flex items-start gap-4 border-b border-hairline py-4 last:border-b-0">
              <span className="text-[15px] font-semibold tabular-nums text-brand">{i + 1}</span>
              <span className="text-[17px] leading-snug text-foreground">{f}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionLabel>{INSTRUCTOR.firstName}&rsquo;s key reminder</SectionLabel>
        <Evidence label={INSTRUCTOR.firstName} tone="instructor" text={STRUCTURED.instructorEmphasis[0]!.quote} />
      </Section>

      <div className="flex flex-col gap-2.5">
        <PrimaryButton href="/prototype/vector/train">
          Train with Vector
          <ArrowRight className="size-[18px]" />
        </PrimaryButton>
        {/* Vector is a brand name a first-time student cannot define. Say what
            it is at the point they are asked to tap it. */}
        <p className="px-1 text-[13px] leading-relaxed text-foreground-faint">
          Vector is your AI flight trainer. It knows what {INSTRUCTOR.firstName} flagged and helps you prepare before{" "}
          {NEXT_LESSON.date}.
        </p>
      </div>

      <div className="flex flex-col">
        <Quiet href="/prototype/vector/debrief" label="Review last debrief" meta="Aug 29" />
        <Quiet href="/prototype/vector/progress" label="See progress" meta="4 skills" />
      </div>
    </Screen>
  );
}

function Quiet({ href, label, meta }: { href: string; label: string; meta: string }) {
  return (
    <Link href={href} className="flex min-h-[52px] items-center gap-3 border-b border-hairline last:border-b-0">
      <span className="flex-1 text-[17px] text-foreground">{label}</span>
      <span className="text-[15px] text-foreground-faint">{meta}</span>
      <ChevronRight className="size-4 text-foreground-faint" />
    </Link>
  );
}
