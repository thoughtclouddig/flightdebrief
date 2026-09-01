import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  History,
  PlaneTakeoff,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { CtaLink } from "@/components/marketing/cta-link";
import { PhotoVisual } from "@/components/marketing/app-screen";
import { appOrigin } from "@/lib/email";

export const metadata: Metadata = {
  title: "AfterFlight for Flight Instructors",
  description: "Know where you left off with every student, every flight. AfterFlight is free for individual CFIs.",
  alternates: appOrigin() ? { canonical: `${appOrigin()}/instructors` } : undefined,
};

const CAPTURED = [
  "What went well",
  "What needs work",
  "Instructor feedback",
  "ACS connections",
  "Study recommendations",
  "Objectives for the next lesson",
] as const;

const BROUGHT_FORWARD = [
  "Where the student left off",
  "Recurring issues",
  "Previous instructor guidance",
  "What the student worked on between flights",
  "Priorities for today's lesson",
] as const;

const STUDENT_OUTCOMES = [
  { icon: ClipboardList, label: "Flight summary" },
  { icon: ShieldCheck, label: "ACS-connected context" },
  { icon: BookOpen, label: "Study resources" },
  { icon: CheckCircle2, label: "Action items" },
  { icon: PlaneTakeoff, label: "Next-flight preparation" },
  { icon: History, label: "Training history" },
] as const;

const WORKFLOW = [
  { step: "1", title: "Fly normally.", copy: "Nothing changes about how you fly the lesson." },
  { step: "2", title: "Have the debrief you're already having.", copy: "The same post-flight conversation, out loud, like always." },
  { step: "3", title: "AfterFlight does the work after that.", copy: "Captured, organized, and ready before the next lesson." },
] as const;

export default function InstructorsPage() {
  return (
    <>
      {/* 1. Hero */}
      <section className="relative overflow-hidden bg-white px-6 pb-20 pt-24 sm:pb-28 sm:pt-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">For Flight Instructors</p>
              <h1
                className="font-display mt-4 text-balance text-[clamp(2.5rem,5vw,3.75rem)] font-extrabold leading-[1.02] text-[#101727]"
                style={{ textTransform: "none" }}
              >
                Know where you left&nbsp;off. Every student. Every flight.
              </h1>
              <p className="mt-6 max-w-md text-balance text-lg leading-relaxed text-[#68717D] tracking-[0.01em]">
                AfterFlight turns the post-flight debrief you&rsquo;re already having into a clear record of what
                happened, what the student needs to work on, and what comes next.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <CtaLink href="/signup/cfi" className="w-full justify-center sm:w-auto">
                  Start using AfterFlight free
                </CtaLink>
              </div>
              <p className="mt-4 text-sm font-semibold text-brand">Free for CFIs.</p>
              {/* One page, and its whole argument is how short it is. The
                  objection here is never "what does it do" -- it is "how much
                  of my time does this cost me after a lesson." */}
              <p className="mt-2 text-sm text-[#68717D]">
                <Link href="/for-instructors-quickstart" className="underline underline-offset-2 hover:text-[#101727]">
                  See the whole workflow
                </Link>{" "}
                &mdash; it fits on one page.
              </p>
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

      {/* 2. The problem -- too many lessons live in memory */}
      <section className="bg-[#f4f5f6] px-6 py-20 sm:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">The Problem</p>
          <h2 className="font-display mt-3 text-balance text-3xl font-bold text-[#101727] sm:text-4xl">
            Too many lessons live in memory.
          </h2>
          <p className="mt-5 text-balance text-lg text-[#68717D] tracking-[0.01em]">
            A good instructor gives valuable feedback after every flight.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-xs font-bold uppercase tracking-wide text-[#101727] sm:text-sm">
            {["Student leaves", "Next lesson", "Days pass", "Reconstructed from memory"].map((step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full bg-white px-4 py-2">{step}</span>
                {i < arr.length - 1 ? <ArrowRight className="size-3.5 text-[#8c97a2]" /> : null}
              </span>
            ))}
          </div>

          <p className="mt-8 text-balance text-lg text-[#68717D] tracking-[0.01em]">
            The issue isn&rsquo;t that instructors don&rsquo;t debrief &mdash; it&rsquo;s that the value of the
            debrief disappears after the conversation ends.
          </p>
        </Reveal>
      </section>

      {/* 3. Core product reveal */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Your Debrief. Remembered.</p>
          <h2 className="font-display mt-3 text-balance text-3xl font-bold text-[#101727] sm:text-4xl">
            The CFI teaches. AfterFlight remembers.
          </h2>
          <p className="mt-5 text-balance text-lg text-[#68717D] tracking-[0.01em]">
            AfterFlight captures the post-flight conversation you&rsquo;re already having and organizes your
            guidance into something useful &mdash; for the student, and for the next lesson.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 text-sm font-bold uppercase tracking-wide sm:flex-row">
            <span className="rounded-full bg-[#f4f5f6] px-4 py-2 text-[#101727]">Debrief</span>
            <ArrowRight className="size-4 rotate-90 text-brand sm:rotate-0" />
            <span className="rounded-full bg-brand px-4 py-2 text-white">AfterFlight</span>
            <ArrowRight className="size-4 rotate-90 text-brand sm:rotate-0" />
            <span className="rounded-full bg-[#f4f5f6] px-4 py-2 text-[#101727]">Continuity</span>
          </div>
        </Reveal>
      </section>

      {/* 4. Two-flight story */}
      <section className="bg-[#f4f5f6] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-balance text-3xl font-bold text-[#101727] sm:text-4xl">
              Pick up where you left off.
            </h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Reveal className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-8">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">After Today&rsquo;s Flight</p>
              <p className="text-balance text-[#68717D] tracking-[0.01em]">
                You have the normal post-flight debrief. AfterFlight preserves:
              </p>
              <ul className="mt-2 flex flex-col gap-2.5">
                {CAPTURED.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[15px] text-[#101727]">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={100} className="flex flex-col gap-4 rounded-2xl border border-brand/30 bg-white p-8">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Before the Next Flight</p>
              <p className="text-balance text-[#68717D] tracking-[0.01em]">
                You don&rsquo;t have to reconstruct the previous lesson. AfterFlight brings forward:
              </p>
              <ul className="mt-2 flex flex-col gap-2.5">
                {BROUGHT_FORWARD.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[15px] text-[#101727]">
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 5. Student benefit */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-balance text-3xl font-bold text-[#101727] sm:text-4xl">
              Your guidance doesn&rsquo;t disappear when the student leaves.
            </h2>
            <p className="mt-5 text-balance text-lg text-[#68717D] tracking-[0.01em]">
              You&rsquo;re still the teacher. AfterFlight just helps the student actually use what you told them
              &mdash; giving your instruction a life beyond the ten-minute conversation after landing.
            </p>
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
            {STUDENT_OUTCOMES.map((item, i) => (
              <Reveal
                key={item.label}
                delay={i * 60}
                className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-[#f4f5f6] px-4 py-6 text-center"
              >
                <item.icon className="size-6 text-brand" strokeWidth={1.75} />
                <p className="text-sm font-semibold text-[#101727]">{item.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. AI objection / trust */}
      <section className="bg-[#f4f5f6] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="font-display text-xl font-bold text-[#101727] sm:text-2xl">
              Your judgment. <span className="text-brand">Not ours.</span>
            </p>
            <p className="mt-3 text-balance text-[#68717D] tracking-[0.01em]">
              AfterFlight doesn&rsquo;t replace the instructor, independently grade the student, or tell the
              student that AI knows better than their CFI. You provide the judgment. AfterFlight helps capture,
              organize, and carry that guidance forward.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 7. Multi-instructor / handoff */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Handoffs</p>
              <h2 className="font-display mt-3 text-balance text-3xl font-bold text-[#101727] sm:text-4xl">
                Different instructor. Same training history.
              </h2>
              <p className="mt-4 text-balance text-[#68717D] tracking-[0.01em]">
                Students don&rsquo;t always fly with the same instructor &mdash; schedule changes, availability,
                stage checks, or a transfer. The next instructor shouldn&rsquo;t have to reconstruct the
                student&rsquo;s recent training from scratch. AfterFlight carries the context from previous
                debriefs forward, so a Handoff Brief is ready whenever another CFI steps in.
              </p>
              <p className="mt-4 text-balance text-base text-[#68717D] tracking-[0.01em]">
                This is about instructional continuity &mdash; not a replacement for official logbooks, training
                records, or endorsements.
              </p>
            </Reveal>

            <Reveal delay={100}>
              <PhotoVisual
                src="/images/marketing/debrief-conference-room.webp"
                alt="Two flight instructors reviewing a student's training history together"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* 8. Keep the workflow simple */}
      <section className="bg-[#f4f5f6] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-balance text-3xl font-bold text-[#101727] sm:text-4xl">
              One more system to maintain? No.
            </h2>
          </Reveal>
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
            {WORKFLOW.map((item, i) => (
              <Reveal key={item.step} delay={i * 100} className="flex flex-col items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {item.step}
                </span>
                <h3 className="font-display text-lg font-bold text-[#101727]">{item.title}</h3>
                <p className="text-balance text-base text-[#68717D] tracking-[0.01em]">{item.copy}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Free for CFIs */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Sparkles className="mx-auto size-8 text-brand" strokeWidth={1.5} />
          <h2 className="font-display mt-4 text-balance text-3xl font-bold text-[#101727] sm:text-4xl">
            Free for CFIs.
          </h2>
          <p className="mt-4 text-balance text-lg text-[#68717D] tracking-[0.01em]">
            You can use AfterFlight with your students at no cost, full stop. If your student is on a paid plan or
            flies at a school running AfterFlight, you get the same continuity either way &mdash; you never need a
            subscription just to use AfterFlight with a student.
          </p>
        </Reveal>
      </section>

      <section className="bg-[#f4f5f6] px-6 py-14">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="text-center">
            <p className="text-[#68717D] tracking-[0.01em]">
              Instructing at a flight school?{" "}
              <Link href="/schools" className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
                See AfterFlight for Schools <ArrowRight className="size-4" />
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      {/* 10. Final CTA */}
      <section className="relative overflow-hidden bg-[#101727] px-6 py-20 text-center sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#171f33_0%,_#0c1220_75%)]" />
        <Reveal className="relative mx-auto max-w-2xl">
          <h2 className="font-display text-balance text-3xl font-bold leading-tight text-white sm:text-4xl">
            Remember every lesson. Start the next one ready.
          </h2>
          <p className="mt-4 text-balance text-white/70">
            Use the debrief you&rsquo;re already having to create continuity across every student&rsquo;s training.
          </p>
          <div className="mt-8 flex justify-center">
            <CtaLink href="/signup/cfi" className="w-full justify-center sm:w-auto">
              Start using AfterFlight free
            </CtaLink>
          </div>
          <p className="mt-5 text-sm text-white/55">Free for CFIs.</p>
        </Reveal>
      </section>
    </>
  );
}
