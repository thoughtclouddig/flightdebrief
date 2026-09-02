import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Compass,
  GraduationCap,
  Headset,
  ListChecks,
  MessagesSquare,
  Network,
  ShieldCheck,
  Target,
} from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { CtaLink } from "@/components/marketing/cta-link";
import { AppScreen, Pill, SummaryRow } from "@/components/marketing/app-screen";
import { ENTERPRISE_PRICING } from "@/lib/marketing/pricing";
import { appOrigin } from "@/lib/email";

export const metadata: Metadata = {
  title: "AfterFlight Enterprise",
  description:
    "AfterFlight captures the post-flight debrief in a consistent structure, so a large training organization can see patterns across students, instructors, locations, and programs.",
  alternates: appOrigin() ? { canonical: `${appOrigin()}/enterprise` } : undefined,
};

const CAPTURED = [
  { icon: CheckCircle2, title: "What Went Well", copy: "What the student did well during the lesson." },
  { icon: Target, title: "What Needs Work", copy: "Skills, maneuvers, procedures, or decisions that need more attention." },
  { icon: MessagesSquare, title: "Instructor Observations", copy: "The actual feedback and guidance given by the CFI." },
  { icon: ListChecks, title: "Action Items", copy: "Specific things the student should practice, study, or remember." },
  { icon: ShieldCheck, title: "ACS Connections", copy: "Relevant FAA Airman Certification Standards connected to the training." },
  { icon: Compass, title: "Next Flight", copy: "What the student should be ready to work on in the next lesson." },
] as const;

/** Short, concrete values (not full sentences) -- SummaryRow's sub-text is a single truncated line, sized for values like "42 active students", not prose. */
const DEBRIEF_EXAMPLE = [
  { icon: CheckCircle2, tone: "#16803d", label: "What Went Well", sub: "4 observations" },
  { icon: Target, tone: "#b45309", label: "What Needs Work", sub: "Steep turns · altitude" },
  { icon: ListChecks, tone: "#56636f", label: "Action Items", sub: "3 next steps" },
  { icon: Compass, tone: "#f07621", label: "Next Flight", sub: "Ready to practice" },
] as const;

const QUESTIONS = [
  "Where are students consistently struggling?",
  "Which skills and ACS areas appear most often?",
  "Are students improving after an instructor identifies a problem?",
  "Which students repeatedly need work in the same area?",
  "What are instructors asking students to work on next?",
  "Are the same training patterns appearing across locations or programs?",
] as const;

const LEVELS = [
  {
    icon: GraduationCap,
    title: "Student",
    copy: "Flights, instructor observations, recurring skill areas, progress, study recommendations, and next-flight objectives.",
  },
  {
    icon: Headset,
    title: "Instructor",
    copy: "The students they train and the observations carried forward from previous lessons.",
  },
  {
    icon: Building2,
    title: "Location",
    copy: "Training activity, recurring skill areas, students needing attention, and debrief adoption at one location.",
  },
  {
    icon: Network,
    title: "Organization",
    copy: "Training patterns across locations, campuses, programs, and student cohorts.",
  },
] as const;

const SCHEDULING_ITEMS = ["Who flew", "When they flew", "Which aircraft they used", "What’s scheduled next"];

const AFTERFLIGHT_ITEMS = [
  "What happened in the training",
  "What the instructor observed",
  "What needs work",
  "Which standards apply",
  "What the student should study",
  "What should happen next",
  "Whether the student is improving",
];

const DEBRIEF_CHAIN = ["Debrief", "Instructor Observations", "ACS", "Study", "Next Lesson", "Progress"] as const;

export default function EnterprisePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-[#101727] px-6 pb-20 pt-32 text-center sm:pb-28 sm:pt-36">
        <div className="absolute inset-0">
          <Image
            src="/images/marketing/enterprise-training-center.webp"
            alt="Students, instructors, and aircraft on the ramp at a flight training center at sunrise"
            fill
            priority
            className="object-cover"
            style={{ filter: "saturate(0.8) brightness(0.8)" }}
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(23,31,51,0.4)_0%,_rgba(12,18,32,0.8)_75%)]" />
        <Reveal className="relative mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">AfterFlight Enterprise</p>
          <h1
            className="font-display mt-4 text-balance text-[clamp(2.5rem,5vw,3.75rem)] font-extrabold leading-[1.02] text-white"
            style={{ textTransform: "none" }}
          >
            Turn every debrief into training intelligence.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-white/70">
            Every day, your instructors talk with students about what went well, what needs work, and what comes
            next. AfterFlight captures those debriefs in a consistent structure and turns them into training data
            your organization can actually use.
          </p>
          <div className="mt-8 flex justify-center">
            <CtaLink href="mailto:sales@getafterflight.com">Talk to Sales</CtaLink>
          </div>
          <p className="mt-5 text-sm text-white/50">Across one location or twenty, see what&rsquo;s happening inside the training.</p>
        </Reveal>
      </section>

      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">The Debrief</p>
            <h2 className="font-display mt-3 text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
              One debrief. Structured from the start.
            </h2>
            <p className="mt-4 text-pretty text-lg text-[#414B57]">
              After each flight, the student and instructor walk through a guided debrief. AfterFlight captures
              the instructor&rsquo;s observations and turns the conversation into a structured record of the
              lesson.
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {CAPTURED.map((item, i) => (
              <Reveal key={item.title} delay={i * 80} className="flex flex-col items-start gap-3">
                <item.icon className="size-8 text-brand" strokeWidth={1.5} />
                <h3 className="font-display text-base font-bold uppercase tracking-wide text-[#101727]">{item.title}</h3>
                <p className="text-pretty text-sm text-[#4E5A67]">{item.copy}</p>
              </Reveal>
            ))}
          </div>

          <div className="mt-16 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal className="mx-auto w-full max-w-md">
              <AppScreen
                header={
                  <>
                    <div className="min-w-0">
                      <p className="font-display truncate text-sm font-bold tracking-tight text-[#101727]">KSDL &rarr; KSEZ</p>
                      <p className="text-xs text-[#8c97a2]">May 12 &middot; 1.3 Hobbs</p>
                    </div>
                    <Pill tone="#16803d">Complete</Pill>
                  </>
                }
              >
                <div className="flex flex-col divide-y divide-black/[0.05]">
                  {DEBRIEF_EXAMPLE.map((row) => (
                    <SummaryRow key={row.label} icon={row.icon} tone={row.tone} label={row.label} sub={row.sub} />
                  ))}
                </div>
              </AppScreen>
            </Reveal>

            <Reveal delay={100} className="rounded-2xl border border-slate-200 bg-[#f4f5f6] p-8 text-center lg:text-left">
              <p className="font-display text-xl font-bold text-[#101727] sm:text-2xl">
                The instructor remains <span className="text-brand">the authority.</span>
              </p>
              <p className="mt-3 text-pretty text-[#414B57]">
                AfterFlight structures and carries forward instructor-reviewed observations. It does not invent an
                AI grade for the flight.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-[#f4f5f6] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px] text-center">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">At Scale</p>
            <h2 className="font-display mt-3 text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
              Now imagine that across your entire operation.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-[#414B57]">
              Instead of thousands of debriefs disappearing into notebooks, memory, or disconnected records,
              AfterFlight builds a structured training history for every student.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <ul className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-x-8 gap-y-5 text-left sm:grid-cols-2">
              {QUESTIONS.map((question) => (
                <li key={question} className="text-lg font-medium text-[#101727]">
                  {question}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
              From one student to the entire organization.
            </h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {LEVELS.map((level, i) => (
              <Reveal key={level.title} delay={i * 100} className="flex flex-col items-start gap-3">
                <level.icon className="size-8 text-brand" strokeWidth={1.5} />
                <h3 className="font-display text-base font-bold uppercase tracking-wide text-[#101727]">{level.title}</h3>
                <p className="text-pretty text-sm text-[#4E5A67]">{level.copy}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4f5f6] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
              See what happens between the flights.
            </h2>
          </Reveal>

          <Reveal delay={100} className="mx-auto mt-12 max-w-4xl">
            <div className="grid grid-cols-1 divide-y divide-slate-200 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="flex flex-col gap-4 p-10">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#8c97a2]/10">
                  <Calendar className="size-6 text-[#8c97a2]" strokeWidth={1.75} />
                </span>
                <p className="font-display text-lg font-bold uppercase tracking-wide text-[#8c97a2]">Your Scheduling System</p>
                <ul className="flex flex-col gap-2">
                  {SCHEDULING_ITEMS.map((item) => (
                    <li key={item} className="text-lg text-[#4E5A67]">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-4 border-brand p-10 sm:border-l-2">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand/15">
                  <Check className="size-6 text-brand" strokeWidth={2.5} />
                </span>
                <p className="font-display text-lg font-bold uppercase tracking-wide text-brand">AfterFlight</p>
                <ul className="flex flex-col gap-2">
                  {AFTERFLIGHT_ITEMS.map((item) => (
                    <li key={item} className="text-lg font-medium text-[#101727]">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          <Reveal delay={150} className="mx-auto mt-10 max-w-2xl text-center">
            <p className="font-display text-xl font-bold text-[#101727] sm:text-2xl">
              AfterFlight adds the layer that begins when the engine shuts down.
            </p>
          </Reveal>

          <Reveal delay={200} className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-x-2 gap-y-3">
            {DEBRIEF_CHAIN.map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full bg-white px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#101727] shadow-sm">
                  {step}
                </span>
                {i < DEBRIEF_CHAIN.length - 1 ? <ArrowRight className="size-4 shrink-0 text-[#8c97a2]" /> : null}
              </span>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Enterprise Capabilities</p>
            <h2 className="font-display mt-3 text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
              Built for larger training organizations.
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <ul className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              {ENTERPRISE_PRICING.capabilities.map((capability) => (
                <li key={capability} className="flex items-start gap-3 text-lg font-semibold text-[#101727]">
                  <Check className="mt-0.5 size-6 shrink-0 text-brand" strokeWidth={2.5} />
                  {capability}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#101727] px-6 py-20 text-center sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#171f33_0%,_#0c1220_75%)]" />
        <Reveal className="relative mx-auto max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">AfterFlight Enterprise</p>
          <h2 className="font-display mt-4 text-balance text-3xl font-bold leading-tight text-white sm:text-4xl">
            See what your training is telling you.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-white/70">
            Turn the debriefs already happening across your organization into a clearer picture of student
            progress, training patterns, and what needs attention next.
          </p>
          <p className="mt-6 font-display text-xl font-bold text-white">{ENTERPRISE_PRICING.priceLabel}</p>
          <p className="mt-2 text-sm text-white/50">{ENTERPRISE_PRICING.pricingDetails.join(" · ")}</p>
          <div className="mt-8">
            <CtaLink href="mailto:sales@getafterflight.com">{ENTERPRISE_PRICING.cta}</CtaLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}
