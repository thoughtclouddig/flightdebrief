import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, ArrowRight, BarChart3, ClipboardCheck, ClipboardList, TrendingUp, Users } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { CtaLink } from "@/components/marketing/cta-link";
import { AppScreen, Pill, SummaryRow } from "@/components/marketing/app-screen";

export const metadata: Metadata = {
  title: "AfterFlight School Pro",
  description:
    "Give instructors a consistent way to close every lesson while giving your school a clearer view of student progress.",
};

const HELPS = [
  {
    icon: ClipboardCheck,
    title: "Consistent Debriefs",
    copy: "Give instructors a shared debrief framework while preserving individual instructor judgment.",
  },
  {
    icon: TrendingUp,
    title: "Student Progress",
    copy: "See instructor-reviewed observations and recurring skill areas across flights.",
  },
  {
    icon: Users,
    title: "CFI + Student Management",
    copy: "Keep students, instructors, and training activity connected in one location.",
  },
  {
    icon: BarChart3,
    title: "Training Insights",
    copy: "Understand where students are progressing, where problems recur, and where additional attention may be needed.",
  },
] as const;

export default function SchoolsPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-white px-6 pb-20 pt-24 sm:pb-28 sm:pt-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">AfterFlight School Pro</p>
              <h1
                className="font-display mt-4 text-balance text-[clamp(2.5rem,5vw,3.75rem)] font-extrabold leading-[1.02] text-[#101727]"
                style={{ textTransform: "none" }}
              >
                Better debriefs across your entire school.
              </h1>
              <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-[#68717D]">
                Give instructors a consistent way to close every lesson while giving your school a clearer view of
                student progress.
              </p>
              <p className="mt-4 max-w-md text-pretty text-base font-semibold text-[#101727]">
                Don&rsquo;t watch a demo. Fly it. Try AfterFlight with your school free for your first 25 debriefs.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <CtaLink href="/signup/school">Get School Pro</CtaLink>
                <CtaLink href="mailto:sales@afterflight.app" variant="secondary">
                  Talk to Us
                </CtaLink>
              </div>
            </Reveal>

            <Reveal delay={100} className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl">
              <Image
                src="/images/marketing/afterflight-branded-aircraft.webp"
                alt="An AfterFlight-branded training aircraft on the ramp at a flight school"
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 620px, 100vw"
              />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-[#f4f5f6] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">The Problem</p>
              <h2 className="font-display mt-3 text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
                A quality lesson shouldn&rsquo;t disappear after shutdown.
              </h2>
              <p className="mt-4 text-pretty text-lg text-[#68717D]">
                Every instructor debriefs differently. Students switch instructors. Lessons happen days apart, and
                important observations end up in notebooks, text messages, or nowhere at all. AfterFlight gives the
                school a common structure without scripting how CFIs teach.
              </p>
            </Reveal>

            <Reveal delay={100} className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
              <Image
                src="/images/marketing/debrief-lounge-screen.webp"
                alt="A student pilot and CFI debriefing together immediately after a flight"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 620px, 100vw"
              />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">How School Pro Helps</p>
            <h2 className="font-display mt-3 text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
              Everything your school needs to keep training consistent.
            </h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {HELPS.map((item, i) => (
              <Reveal key={item.title} delay={i * 100} className="flex flex-col items-start gap-3">
                <item.icon className="size-8 text-brand" strokeWidth={1.5} />
                <h3 className="font-display text-base font-bold uppercase tracking-wide text-[#101727]">{item.title}</h3>
                <p className="text-balance text-sm text-[#68717D]">{item.copy}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4f5f6] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">School Dashboard</p>
              <h2 className="font-display mt-3 text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
                A clear view of training across your school.
              </h2>
              <p className="mt-4 text-pretty text-lg text-[#68717D]">
                See who&rsquo;s training, how debriefs are going, and where students need attention&mdash;without
                ranking or second-guessing your instructors.
              </p>
            </Reveal>

            <Reveal delay={100} className="mx-auto w-full max-w-md">
              <AppScreen
                header={
                  <>
                    <p className="font-display truncate text-sm font-bold tracking-tight text-[#101727]">
                      Scottsdale Flight Academy
                    </p>
                    <Pill tone="#56636f">This Month</Pill>
                  </>
                }
              >
                <div className="flex flex-col divide-y divide-black/[0.05]">
                  <SummaryRow icon={Users} tone="#f07621" label="Students Training" sub="42 active students" />
                  <SummaryRow icon={ClipboardList} tone="#16803d" label="Debrief Completion" sub="118 debriefs · 94%" />
                  <SummaryRow icon={TrendingUp} tone="#b45309" label="Recurring ACS Area" sub="Steep Turns" />
                  <SummaryRow icon={AlertTriangle} tone="#c0362b" label="Needing Attention" sub="3 students" />
                </div>
              </AppScreen>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="mx-auto max-w-2xl rounded-2xl border-2 border-brand bg-white p-10 text-center shadow-lg shadow-brand/10 sm:p-12">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">School Pro Pricing</p>
            <p className="font-display mt-4 text-7xl font-bold text-[#101727]">
              $99
              <span className="ml-2 tracking-normal text-xl font-medium text-[#68717D]">/month/location</span>
            </p>
            <p className="mt-2 text-base font-semibold text-brand">Your school&rsquo;s first 25 debriefs are free.</p>
            <p className="mt-4 text-lg text-[#68717D]">
              For independent flight schools and individual training locations.
            </p>

            <div className="mt-8">
              <CtaLink href="/signup/school">Get School Pro</CtaLink>
            </div>

            <p className="mt-6 border-t border-slate-200 pt-6 text-pretty text-sm font-semibold text-[#101727]">
              Student Pilot subscriptions are separate and not included in School Pro.
            </p>
          </Reveal>

          <Reveal delay={100} className="mx-auto mt-8 max-w-2xl">
            <Link
              href="/enterprise"
              className="flex flex-col items-center justify-between gap-3 rounded-xl border border-[#101727]/10 bg-[#f4f5f6] px-6 py-5 text-center sm:flex-row sm:text-left"
            >
              <p className="text-lg font-semibold text-[#101727]">
                Multiple locations, campuses, or training programs?
              </p>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-base font-bold text-brand">
                Explore AfterFlight Enterprise <ArrowRight className="size-4" />
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#101727] px-6 py-20 text-center sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#171f33_0%,_#0c1220_75%)]" />
        <Reveal className="relative mx-auto max-w-2xl">
          <h2 className="font-display text-balance text-3xl font-bold leading-tight text-white sm:text-4xl">
            Make every lesson easier to build on.
          </h2>
          <div className="mt-8">
            <CtaLink href="/signup/school">Get School Pro</CtaLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}
