import Link from "next/link";
import { ArrowRight, Building2, GraduationCap, Headset, Network } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const AUDIENCES = [
  {
    icon: GraduationCap,
    title: "Students",
    copy: "Turn every debrief into a clearer plan for your next flight.",
    cta: "For Students",
    href: "/signup/student",
    id: undefined,
  },
  {
    icon: Headset,
    title: "CFIs",
    copy: "Give every student a better debrief without adding more paperwork.",
    cta: "For Instructors",
    href: "/instructors",
    id: undefined,
  },
  {
    icon: Building2,
    title: "Flight Schools",
    copy: "Create a consistent debrief process and see how students are progressing across your school.",
    cta: "For Schools",
    href: "/schools",
    id: undefined,
  },
  {
    icon: Network,
    title: "Enterprise",
    copy: "Connect training across multiple locations, campuses, and programs.",
    cta: "For Enterprise",
    href: "/enterprise",
    id: undefined,
  },
] as const;

export function WhoItsFor() {
  return (
    <section className="bg-white px-6 pb-28 pt-14 sm:pb-36 sm:pt-16">
      <div className="mx-auto max-w-[1320px]">
        <Reveal className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">Who&rsquo;s It For</p>
          <h2 className="font-display mt-3 text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
            Who is AfterFlight for?
          </h2>
        </Reveal>

        <div className="mx-auto mt-14 grid gap-12 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4">
          {AUDIENCES.map((a, i) => (
            <div key={a.title} id={a.id}>
              <Reveal delay={i * 100} className="flex flex-col items-start gap-4">
                <a.icon className="size-8 text-brand" strokeWidth={1.5} />
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[#101727]">{a.title}</h3>
                <p className="text-balance text-[#68717D]">{a.copy}</p>
                <Link
                  href={a.href}
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
                >
                  {a.cta}
                  <ArrowRight className="size-4" />
                </Link>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
