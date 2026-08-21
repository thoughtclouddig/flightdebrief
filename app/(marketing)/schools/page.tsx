import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  ClipboardList,
  Eye,
  GraduationCap,
  Plane,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { CtaLink } from "@/components/marketing/cta-link";
import { AppScreen, Pill, PhotoVisual, SummaryRow } from "@/components/marketing/app-screen";

export const metadata: Metadata = {
  title: "AfterFlight for Flight Schools",
  description:
    "See what's happening between the schedule and the checkride. AfterFlight turns the post-flight debriefs already happening at your school into student continuity and training visibility.",
};

const SCHEDULING_KNOWS = ["Student", "Instructor", "Aircraft", "Reservation", "Time"] as const;
const AFTERFLIGHT_HELPS = ["What happened", "What the instructor saw", "What needs work", "What keeps recurring", "What happens next"] as const;

const LEVELS = [
  { icon: GraduationCap, title: "Student", copy: "Knows what to study and what comes next." },
  { icon: Users, title: "CFI", copy: "Knows where the student left off." },
  { icon: Eye, title: "School", copy: "Can see patterns across training." },
] as const;

const WORKFLOW = [
  { step: "1", title: "Fly normally.", copy: "Nothing changes about how a lesson gets flown." },
  { step: "2", title: "Have the debrief you're already having.", copy: "The same post-flight conversation, out loud, like always." },
  { step: "3", title: "AfterFlight does the work after that.", copy: "Captured, organized, and visible across the school." },
] as const;

const FLYWHEEL = ["Flight", "Debrief", "Student Prepares", "Next CFI Has Context", "School Sees Patterns", "Better Training"] as const;

export default function SchoolsPage() {
  return (
    <>
      {/* 1. Hero */}
      <section className="relative overflow-hidden bg-white px-6 pb-20 pt-24 sm:pb-28 sm:pt-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">For Flight Schools</p>
              <h1
                className="font-display mt-4 text-balance text-[clamp(2.5rem,5vw,3.75rem)] font-extrabold leading-[1.02] text-[#101727]"
                style={{ textTransform: "none" }}
              >
                See what&rsquo;s happening between the schedule and the checkride.
              </h1>
              <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-[#68717D] tracking-[0.01em]">
                AfterFlight turns the post-flight debriefs already happening across your school into better student
                continuity, clearer instructor handoffs, and visibility into where training is getting stuck.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <CtaLink href="/signup/school" className="w-full justify-center sm:w-auto">
                  Try AfterFlight with your school
                </CtaLink>
              </div>
              <p className="mt-4 text-sm font-semibold text-brand">Your first 25 debriefs are free.</p>
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

      {/* 2. The blind spot */}
      <section className="bg-[#f4f5f6] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-balance text-3xl font-bold text-[#101727] sm:text-4xl">
              Scheduling software manages the flight.
              <br />
              AfterFlight preserves what was learned from it.
            </h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Reveal className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-8">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8c97a2]">Your Scheduling System Knows</p>
              <ul className="mt-2 flex flex-col gap-2.5">
                {SCHEDULING_KNOWS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[15px] text-[#101727]">
                    <CalendarClock className="mt-0.5 size-4 shrink-0 text-[#8c97a2]" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={100} className="flex flex-col gap-4 rounded-2xl border border-brand/30 bg-white p-8">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">AfterFlight Helps You Understand</p>
              <ul className="mt-2 flex flex-col gap-2.5">
                {AFTERFLIGHT_HELPS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[15px] text-[#101727]">
                    <Search className="mt-0.5 size-4 shrink-0 text-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3. How AfterFlight works -- three levels */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">How AfterFlight Works</p>
            <h2 className="font-display mt-3 text-balance text-3xl font-bold text-[#101727] sm:text-4xl">
              Every debrief becomes part of the training picture.
            </h2>
            <p className="mt-5 text-pretty text-lg text-[#68717D] tracking-[0.01em]">
              The CFI and student have the same post-flight conversation they&rsquo;re already having. AfterFlight
              captures and organizes it &mdash; and what begins as one debrief becomes useful at every level.
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-3">
            {LEVELS.map((item, i) => (
              <Reveal key={item.title} delay={i * 100} className="flex flex-col items-center gap-3 text-center">
                <item.icon className="size-8 text-brand" strokeWidth={1.5} />
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[#101727]">{item.title}</h3>
                <p className="text-balance text-[#68717D] tracking-[0.01em]">{item.copy}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Training continuity */}
      <section className="bg-[#f4f5f6] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Training Continuity</p>
              <h2 className="font-display mt-3 text-balance text-3xl font-bold text-[#101727] sm:text-4xl">
                Different instructor. Same training history.
              </h2>
              <p className="mt-4 text-pretty text-[#68717D] tracking-[0.01em]">
                Students don&rsquo;t always fly with the same instructor &mdash; schedule changes, CFI availability,
                stage and check flights, turnover, transfers. The next instructor shouldn&rsquo;t have to
                reconstruct a student&rsquo;s recent training from scratch. AfterFlight carries the context from
                previous debriefs forward.
              </p>
              <p className="mt-4 text-pretty text-base text-[#68717D] tracking-[0.01em]">
                This is about instructional continuity &mdash; not a replacement for official logbooks, training
                records, or endorsements.
              </p>
            </Reveal>

            <Reveal delay={100}>
              <PhotoVisual
                src="/images/marketing/debrief-boardroom-screen.webp"
                alt="Flight school instructors reviewing student training records together"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* 5. School view */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">School Visibility</p>
              <h2 className="font-display mt-3 text-balance text-3xl font-bold text-[#101727] sm:text-4xl">
                See where students keep getting stuck.
              </h2>
              <p className="mt-4 text-pretty text-lg text-[#68717D] tracking-[0.01em]">
                Recurring deficiencies, repeated training objectives, ACS areas that keep coming up, students who
                need more attention &mdash; patterns across many students that a single lesson could never show.
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

      {/* 6. Why aggregation matters */}
      <section className="bg-[#f4f5f6] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center sm:p-10">
            <p className="font-display text-balance text-xl font-bold text-[#101727] sm:text-2xl">
              One student struggling with stabilized approaches is a lesson.
              <br />
              <span className="text-brand">Fourteen students struggling with stabilized approaches is information
              for the school.</span>
            </p>
            <p className="mt-4 text-pretty text-[#68717D] tracking-[0.01em]">
              That kind of visibility can point to curriculum opportunities, ground-instruction gaps, recurring ACS
              weaknesses, or areas worth additional emphasis. AfterFlight surfaces the pattern &mdash; your training
              leadership makes the call on what it means.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 7. Support for CFIs, not surveillance */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-balance text-3xl font-bold text-[#101727] sm:text-4xl">
              Give instructors continuity. Give leadership visibility.
            </h2>
            <p className="mt-5 text-pretty text-lg text-[#68717D] tracking-[0.01em]">
              AfterFlight should help CFIs teach, not create another administrative burden. Leadership gains
              visibility because useful information is captured naturally through training &mdash; not because
              instructors filled out another long form.
            </p>
          </Reveal>
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
            {WORKFLOW.map((item, i) => (
              <Reveal key={item.step} delay={i * 100} className="flex flex-col items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {item.step}
                </span>
                <h3 className="font-display text-lg font-bold text-[#101727]">{item.title}</h3>
                <p className="text-pretty text-base text-[#68717D] tracking-[0.01em]">{item.copy}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 8. The flywheel */}
      <section className="bg-[#f4f5f6] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-2 gap-y-3">
            {FLYWHEEL.map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide sm:text-sm ${
                    i === 0 ? "bg-brand text-white" : "bg-white text-[#101727]"
                  }`}
                >
                  {step}
                </span>
                {i < FLYWHEEL.length - 1 ? <ArrowRight className="size-3.5 rotate-90 text-[#8c97a2] sm:rotate-0" /> : null}
              </span>
            ))}
          </Reveal>
        </div>
      </section>

      {/* 9. Pricing / first 25 free */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="mx-auto max-w-2xl rounded-2xl border-2 border-brand bg-white p-10 text-center shadow-lg shadow-brand/10 sm:p-12">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">School Pro Pricing</p>
            <p className="font-display mt-4 text-[clamp(3rem,2.25rem+3vw,4.5rem)] font-bold text-[#101727]">
              $99
              <span className="ml-2 text-base tracking-normal font-medium text-[#68717D] sm:text-xl">/month/location</span>
            </p>
            <p className="mt-1.5 text-sm font-semibold text-brand">or $990/year/location &mdash; save 17%</p>
            <p className="mt-2 text-base font-semibold text-brand">Your first 25 debriefs are free.</p>
            <p className="mt-4 text-lg text-[#68717D] tracking-[0.01em]">
              Try AfterFlight with a few instructors and students before you commit &mdash; for independent flight
              schools and individual training locations.
            </p>

            <div className="mt-8 flex justify-center">
              <CtaLink href="/signup/school" className="w-full justify-center sm:w-auto">
                Try AfterFlight with your school
              </CtaLink>
            </div>

            <p className="mt-6 border-t border-slate-200 pt-6 text-pretty text-base font-semibold text-[#101727]">
              Student Pilot subscriptions are separate and not included in School Pro.
            </p>
          </Reveal>

          {/* 10. Subtle Enterprise pathway */}
          <Reveal delay={100} className="mx-auto mt-8 max-w-2xl">
            <Link
              href="/enterprise"
              className="flex flex-col items-center justify-between gap-3 rounded-xl border border-[#101727]/10 bg-[#f4f5f6] px-6 py-5 text-center sm:flex-row sm:text-left"
            >
              <p className="text-lg font-semibold text-[#101727]">
                University or multi-location training organization?
              </p>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-base font-bold text-brand">
                Explore AfterFlight Enterprise <ArrowRight className="size-4" />
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* 11. Final CTA */}
      <section className="relative overflow-hidden bg-[#101727] px-6 py-20 text-center sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#171f33_0%,_#0c1220_75%)]" />
        <Reveal className="relative mx-auto max-w-2xl">
          <Plane className="mx-auto size-8 text-brand" strokeWidth={1.5} />
          <h2 className="font-display mt-4 text-balance text-3xl font-bold leading-tight text-white sm:text-4xl">
            Turn every debrief into better training.
          </h2>
          <p className="mt-4 text-pretty text-white/70">
            Give students continuity, help instructors pick up where training left off, and see where your school
            can improve.
          </p>
          <div className="mt-8 flex justify-center">
            <CtaLink href="/signup/school" className="w-full justify-center sm:w-auto">
              Try your first 25 debriefs free
            </CtaLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}
