import Link from "next/link";
import { ArrowRight, Building2, GraduationCap, Headset } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

/**
 * Students first, and not just first in the list -- first in weight.
 *
 * The four cards used to be equal, which said the buyer might be a student, an
 * instructor, a school or an enterprise, and let the reader pick. Students are
 * the buyer now, so the student card takes the full width and the other two
 * sit under it. Enterprise is gone from the homepage entirely; /enterprise
 * still exists for anyone who goes looking.
 */
const PRIMARY = {
  icon: GraduationCap,
  title: "Student Pilots",
  copy: "Turn every debrief into exactly what to learn and practice next -- with a CFI, or flying on your own.",
  cta: "Start free",
  href: "/signup/student",
} as const;

const SECONDARY = [
  {
    icon: Headset,
    title: "CFIs",
    copy: "Give your normal debrief. AfterFlight handles the student follow-through.",
    cta: "For instructors",
    href: "/instructors",
  },
  {
    icon: Building2,
    title: "Flight Schools",
    copy: "Training continuity that survives an instructor change, and progress you can actually see.",
    cta: "For schools",
    href: "/schools",
  },
] as const;

export function WhoItsFor() {
  return (
    <section className="bg-[#f4f5f6] px-6 pb-28 pt-20 sm:pb-36 sm:pt-24">
      <div className="mx-auto max-w-[1320px]">
        <Reveal className="text-center">
          <p className="text-balance text-sm font-bold uppercase tracking-[0.16em] text-brand">Who&rsquo;s It For</p>
          <h2 className="font-display mt-3 text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
            Built for the person paying for the lesson.
          </h2>
        </Reveal>

        <Reveal delay={80} className="mx-auto mt-14 max-w-[900px]">
          <div className="rounded-2xl bg-[#142033] px-8 py-9 sm:px-12 sm:py-11">
            <PRIMARY.icon className="size-9 text-brand" strokeWidth={1.5} aria-hidden />
            <h3 className="font-display mt-5 text-balance text-3xl font-bold text-white sm:text-4xl">
              {PRIMARY.title}
            </h3>
            <p className="text-pretty mt-3 max-w-xl text-lg leading-relaxed text-[#9da7b8]">{PRIMARY.copy}</p>
            <Link
              href={PRIMARY.href}
              className="mt-7 inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-brand px-7 text-base font-semibold text-white transition-colors hover:bg-brand-bright"
            >
              {PRIMARY.cta}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </Reveal>

        <div className="mx-auto mt-6 grid max-w-[900px] gap-6 sm:grid-cols-2">
          {SECONDARY.map((a, i) => (
            <Reveal key={a.title} delay={160 + i * 90}>
              <div className="flex h-full flex-col items-start gap-3 rounded-2xl border border-black/[0.07] bg-white px-7 py-7">
                <a.icon className="size-7 text-brand" strokeWidth={1.5} aria-hidden />
                <h3 className="font-display text-xl font-bold text-[#101727]">{a.title}</h3>
                <p className="text-pretty text-base leading-relaxed text-[#414B57]">{a.copy}</p>
                <Link
                  href={a.href}
                  className="mt-auto inline-flex items-center gap-1.5 pt-3 text-base font-semibold text-brand hover:underline"
                >
                  {a.cta}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
