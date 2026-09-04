import type { Metadata } from "next";
import { ClipboardList, Mic, PlaneTakeoff, Sparkles } from "lucide-react";
import { AcsBadge, BackLink, Card, PageTitle, Screen, Section, SkillMeter } from "@/components/student/ui";
import { ACS_AREAS } from "@/lib/prototype-fixtures/vector-data";

export const metadata: Metadata = { title: "How AfterFlight works — AfterFlight", robots: { index: false, follow: false } };

/**
 * The guide.
 *
 * Four steps, then the two things that genuinely confuse people on first
 * contact: what Vector is, and what a skill score does and does not mean.
 * Everything here is answering a question a student has actually asked --
 * it is not a feature tour.
 */
const STEPS = [
  {
    icon: Mic,
    title: "Debrief",
    body: "After the flight, record your instructor talking through it the way they normally do. Nothing to fill in. About ninety seconds.",
  },
  {
    icon: ClipboardList,
    title: "Understand",
    body: "AfterFlight sorts it into what went well, what still needs work, and what your instructor wants next — then asks you to confirm it got it right.",
  },
  {
    icon: Sparkles,
    title: "Train with Vector",
    body: "Vector explains the weak spots, checks your understanding, and rehearses the parts you're still getting wrong.",
  },
  {
    icon: PlaneTakeoff,
    title: "Fly prepared",
    body: "You show up to the next lesson with a short list of things to study, remember and practice.",
  },
] as const;

export default function GuidePage() {
  return (
    <Screen>
      <BackLink href="/prototype/vector/profile">Profile</BackLink>
      <PageTitle kicker="The short version">How AfterFlight works</PageTitle>

      <Section title={<>The loop</>}>
        <ol className="flex flex-col gap-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-surface-sunken text-brand">
                <s.icon className="size-[18px]" strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-semibold text-foreground">
                  {i + 1}. {s.title}
                </p>
                <p className="mt-1 text-[15px] leading-relaxed text-foreground-soft">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title={<>What Vector is</>} flush>
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-4 text-brand" aria-hidden />
            <span className="text-[17px] font-semibold tracking-tight text-foreground">Vector</span>
          </div>
          <p className="text-[15px] leading-relaxed text-foreground-soft">
            Your AI flight trainer. It isn&rsquo;t a general chatbot you have to explain yourself to &mdash; it opens
            already knowing your debriefs, what your instructor flagged, what keeps recurring, and what
            you&rsquo;re working on next.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground-soft">
            When an answer needs a source, Vector uses the FAA Airplane Flying Handbook, the ACS and your POH, and
            says so.
          </p>
        </Card>
      </Section>

      <Section title={<>What the scores mean</>} flush>
        <Card className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <SkillMeter score={3} max={4} state="Improving" />
            <span className="text-[15px] text-foreground-soft">Three of four, improving</span>
          </div>
          <p className="text-[15px] leading-relaxed text-foreground-soft">
            Each score covers one skill and comes from your instructor&rsquo;s own words about that skill. Tap any
            skill to see the sentence behind the number.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground-soft">
            {/* The absence is stated plainly and once, rather than as a
                disclaimer repeated on every screen. */}
            There is no overall score and no readiness percentage. Whether you&rsquo;re ready to solo or take a
            checkride is your instructor&rsquo;s call.
          </p>
          <AcsBadge area={ACS_AREAS.landings} code="PA.IV.B" />
          <p className="text-[15px] leading-relaxed text-foreground-soft">
            Skills are tagged to their FAA Airman Certification Standards area, so what you practice here lines up
            with what you&rsquo;ll be tested on.
          </p>
        </Card>
      </Section>

      <Section title={<>Your audio</>}>
        <p className="text-[15px] leading-relaxed text-foreground-soft">
          Recordings are transcribed and then discarded. AfterFlight keeps the training record, not the recording.
        </p>
      </Section>
    </Screen>
  );
}
