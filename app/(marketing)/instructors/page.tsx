import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle, NotebookPen, Repeat, ShieldCheck, Target } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { CtaLink } from "@/components/marketing/cta-link";
import { AppScreen, Pill, SummaryRow } from "@/components/marketing/app-screen";

export const metadata: Metadata = {
  title: "AfterFlight for Flight Instructors",
  description: "Give every student a better debrief without adding more paperwork. AfterFlight is free for individual CFIs.",
};

const HELPS = [
  {
    icon: MessageCircle,
    title: "Better Debriefs",
    copy: "Guided prompts help make sure the important parts of the lesson get discussed.",
  },
  {
    icon: NotebookPen,
    title: "Clear Next Steps",
    copy: "Students leave knowing what to practice, what to study, and what improvement should look like.",
  },
  {
    icon: Repeat,
    title: "Continuity",
    copy: "Instructor observations stay connected across flights so the next lesson doesn't start from zero.",
  },
] as const;

export default function InstructorsPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-white px-6 pb-20 pt-24 sm:pb-28 sm:pt-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">For Flight Instructors</p>
              <h1
                className="font-display mt-4 text-balance text-[clamp(2.5rem,5vw,3.75rem)] font-extrabold leading-[1.02] text-[#101727]"
                style={{ textTransform: "none" }}
              >
                Give every student a better debrief.
              </h1>
              <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-[#68717D]">
                AfterFlight helps you capture what matters, give students clear next steps, and keep their training
                connected from one lesson to the next.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <CtaLink href="/signup/cfi">Start Free</CtaLink>
                <CtaLink href="/#how-it-works" variant="secondary">
                  See How It Works
                </CtaLink>
              </div>
            </Reveal>

            <Reveal delay={100} className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl">
              <Image
                src="/images/marketing/preflight-cfi-student.webp"
                alt="A CFI briefing a student pilot beside a Diamond DA40 on the ramp before a flight"
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
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-balance text-3xl font-bold text-[#101727] sm:text-4xl">
            You already give the feedback.
            <br />
            AfterFlight makes it stick.
          </h2>
          <p className="mt-5 text-pretty text-lg text-[#68717D]">
            A great ten-minute debrief can fade fast. Students forget details, notes get scattered across
            notebooks and texts, and the next lesson might not happen for days&mdash;maybe with a different
            instructor. AfterFlight turns that conversation into something the student can keep using.
          </p>
        </Reveal>
      </section>

      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-3">
            {HELPS.map((item, i) => (
              <Reveal key={item.title} delay={i * 100} className="flex flex-col items-start gap-4">
                <item.icon className="size-8 text-brand" strokeWidth={1.5} />
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[#101727]">{item.title}</h3>
                <p className="text-balance text-[#68717D]">{item.copy}</p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={300} className="mx-auto mt-16 max-w-2xl rounded-2xl border border-slate-200 bg-[#f4f5f6] p-8 text-center">
            <p className="font-display text-xl font-bold text-[#101727] sm:text-2xl">
              Your judgment. Your feedback. <span className="text-brand">Better follow-through.</span>
            </p>
            <p className="mt-3 text-pretty text-sm text-[#68717D]">
              AfterFlight is built around instructor-reviewed observations&mdash;not an algorithm grading your
              student. You&rsquo;re still the instructor. AfterFlight just makes sure what you said doesn&rsquo;t
              disappear after the lesson.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#f4f5f6] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">A real example</p>
              <h2 className="font-display mt-3 text-balance text-3xl font-bold text-[#101727] sm:text-4xl">
                Your feedback doesn&rsquo;t disappear after the lesson.
              </h2>
              <p className="mt-4 text-pretty text-[#68717D]">
                Say what you already say after a flight. AfterFlight connects it to the standard, the study
                material, and the next lesson&mdash;automatically.
              </p>
            </Reveal>

            <Reveal delay={100}>
              <AppScreen
                header={
                  <>
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-bold uppercase tracking-wide text-[#8c97a2]">Area to Improve</p>
                      <p className="truncate text-[13px] font-bold text-[#101727]">Steep Turns &middot; Altitude Control</p>
                    </div>
                    <Pill tone="#b45309">Instructor note</Pill>
                  </>
                }
              >
                <p className="text-pretty text-[13px] italic text-[#68717D]">
                  &ldquo;Get the trim set before entry and use the horizon as your primary outside reference.&rdquo;
                </p>
                <div className="mt-4 flex flex-col divide-y divide-black/[0.05] border-t border-black/[0.05]">
                  <SummaryRow icon={ShieldCheck} tone="#f07621" label="ACS Connection" sub="PA.V.A.S3" />
                  <SummaryRow icon={Target} tone="#f07621" label="Next-Flight Objective" sub="Maintain altitude ±100 ft" />
                </div>
              </AppScreen>
            </Reveal>
          </div>

          <Reveal delay={200} className="mt-16 text-center">
            <p className="text-[#68717D]">
              Working with an entire flight school?{" "}
              <Link href="/schools" className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
                Explore School Pro <ArrowRight className="size-4" />
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#101727] px-6 py-20 text-center sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#171f33_0%,_#0c1220_75%)]" />
        <Reveal className="relative mx-auto max-w-2xl">
          <h2 className="font-display text-balance text-3xl font-bold leading-tight text-white sm:text-4xl">
            Better debriefs. Better-prepared students.
          </h2>
          <div className="mt-8">
            <CtaLink href="/signup/cfi">Start Free</CtaLink>
          </div>
          <p className="mt-5 text-sm text-white/55">AfterFlight is free for individual CFIs.</p>
        </Reveal>
      </section>
    </>
  );
}
