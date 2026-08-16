import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  ListChecks,
  MessageCircle,
  MessagesSquare,
  Navigation as NavigationIcon,
  Radio,
  ShieldCheck,
  Target,
} from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { AppScreen, Pill, PhotoVisual, SummaryRow } from "@/components/marketing/app-screen";

/** Qualitative bands only -- this card is training progress across flights, never a grade for one flight. Icons match the dedicated FlightScore section elsewhere on the page for consistency. */
const PROGRESS_SKILLS = [
  { label: "Aircraft Control", band: "Strong", color: "#2f7a4e", icon: Gauge },
  { label: "Procedures", band: "Progressing", color: "#2f7a4e", icon: ClipboardCheck },
  { label: "Navigation", band: "Developing", color: "#b87621", icon: NavigationIcon },
  { label: "Communication", band: "Strong", color: "#2f7a4e", icon: MessageCircle },
  { label: "Decision Making", band: "Progressing", color: "#2f7a4e", icon: Brain },
] as const;

const CARDS = [
  {
    eyebrow: "Guided Debriefs",
    headline: "Make every debrief count.",
    copy: "Structured prompts guide the conversation between student and instructor so the important parts of the flight don't disappear when the debrief ends.",
    visual: (
      <PhotoVisual
        src="/images/marketing/debrief-lounge-screen.webp"
        alt="A student pilot and CFI debriefing together immediately after a flight"
      />
    ),
  },
  {
    eyebrow: "Flight Summary",
    headline: "Your whole debrief. Organized.",
    copy: "What went well, what needs work, instructor observations, action items, and key takeaways stay together in one useful flight record.",
    visual: (
      <AppScreen
        header={
          <>
            <div className="min-w-0">
              <p className="font-display truncate text-sm font-bold tracking-tight text-[#101727]">KSDL &rarr; KSEZ</p>
              <p className="text-[11px] text-[#8c97a2]">May 12 &middot; 1.3 Hobbs</p>
            </div>
            <Pill tone="#16803d">Complete</Pill>
          </>
        }
      >
        <div className="flex flex-col divide-y divide-black/[0.05]">
          <SummaryRow icon={CheckCircle2} tone="#16803d" label="What went well" sub="4 observations" />
          <SummaryRow icon={Target} tone="#b45309" label="Areas to improve" sub="2 focus areas" />
          <SummaryRow icon={ListChecks} tone="#56636f" label="Action items" sub="3 next steps" />
          <SummaryRow icon={MessagesSquare} tone="#101727" label="Key takeaways" sub="Recorded during debrief" />
        </div>
      </AppScreen>
    ),
  },
  {
    eyebrow: "ACS Connection",
    headline: "Know your ACS standard.",
    copy: "AfterFlight connects relevant lesson feedback to FAA Airman Certification Standards so you can see what you're working toward.",
    visual: (
      <AppScreen
        header={
          <>
            <div className="min-w-0">
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-[#8c97a2]">Area to Improve</p>
              <p className="truncate text-[13px] font-bold text-[#101727]">Steep Turns &middot; Altitude Control</p>
            </div>
            <Pill tone="#b45309">+180 ft</Pill>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-lg bg-brand/5 p-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/15">
            <ShieldCheck className="size-4 text-brand" />
          </span>
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-wide text-brand">ACS &middot; PA.V.A.S3</p>
            <p className="text-[12px] text-[#68717D]">Maintain altitude &plusmn;100 ft</p>
            <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-brand">
              View ACS standard <ArrowRight className="size-3" />
            </span>
          </div>
        </div>
      </AppScreen>
    ),
  },
  {
    eyebrow: "Study Resources",
    headline: "Know exactly what to study next.",
    copy: "Go from a weak area directly to relevant FAA references, instructor resources, and school training material.",
    visual: (
      <PhotoVisual
        src="/images/marketing/student-studying-acs.webp"
        alt="A student pilot reviewing FAA Airman Certification Standards on a tablet at a desk with the Airplane Flying Handbook"
      />
    ),
  },
  {
    eyebrow: "Next-Flight Briefing",
    headline: "Show up ready to fly.",
    copy: "AfterFlight turns the last debrief into a clear starting point for the next lesson: what to practice, what to study, and where to focus.",
    visual: (
      <AppScreen
        header={
          <>
            <p className="font-display text-sm font-bold text-[#101727]">Next Flight</p>
            <Pill tone="#f07621">3 Focus Areas</Pill>
          </>
        }
      >
        <div className="flex flex-col divide-y divide-black/[0.05]">
          <SummaryRow icon={Target} tone="#f07621" label="Steep Turns" sub="Focus: Altitude control" />
          <SummaryRow icon={Gauge} tone="#f07621" label="Short-Field Landing" sub="Focus: Target airspeed" />
          <SummaryRow icon={Radio} tone="#f07621" label="Radio Calls" sub="Practice: Tower phraseology" />
        </div>
      </AppScreen>
    ),
  },
  {
    eyebrow: "Training Progress",
    headline: "See your training take shape.",
    copy: "Instructor-reviewed observations across flights reveal where you're improving, what keeps recurring, and where more work is needed.",
    visual: (
      <AppScreen
        header={
          <>
            <p className="font-display text-sm font-bold text-[#101727]">Training Progress</p>
            <Pill tone="#56636f">5 Skills</Pill>
          </>
        }
      >
        <div className="flex flex-col divide-y divide-black/[0.05]">
          {PROGRESS_SKILLS.map((skill) => (
            <div key={skill.label} className="flex items-center gap-3 py-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#8c97a21a" }}>
                <skill.icon className="size-4 text-[#68717D]" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-[#101727]">{skill.label}</span>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: `${skill.color}1a`, color: skill.color }}
              >
                {skill.band}
              </span>
            </div>
          ))}
        </div>
      </AppScreen>
    ),
  },
] as const;

export function EverythingThatMatters() {
  return (
    <section className="bg-[#f4f5f6] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1320px]">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
            Everything AfterFlight does after you land.
          </h2>
          <p className="mt-4 text-balance text-lg text-[#68717D]">
            AfterFlight captures the conversation, organizes what matters, connects it to the standards, and turns
            it into a plan for your next flight.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card, i) => (
            <Reveal key={card.eyebrow} delay={(i % 3) * 100} className="flex flex-col gap-4">
              {card.visual}
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">{card.eyebrow}</p>
                <p className="font-display mt-1.5 truncate text-xl font-bold text-[#101727]">{card.headline}</p>
                <p className="text-pretty mt-2 text-sm leading-relaxed text-[#68717D]">{card.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
