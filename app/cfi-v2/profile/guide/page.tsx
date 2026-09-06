import { CalendarClock, Mic, PlaneTakeoff, Target, Users } from "lucide-react";
import { getViewer } from "@/lib/viewer";
import { BackLink, PageTitle, Screen, Section } from "@/components/student/ui";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    icon: CalendarClock,
    title: "Today",
    body: "Start here every day -- who you're flying with, and what needs your attention before you do.",
  },
  {
    icon: Target,
    title: "Prepare",
    body: "Open a student's profile before the lesson -- current focus, last flight, and anything left over from before.",
  },
  {
    icon: Mic,
    title: "Assess & debrief",
    body: "Rate the flight independently, then record the debrief the way you normally talk through it. Nothing extra to fill in.",
  },
  {
    icon: Users,
    title: "See where you differed",
    body: "Your rating and the student's own rating show up side by side -- not a scorecard, just where the conversation is worth spending time.",
  },
  {
    icon: PlaneTakeoff,
    title: "Carry it forward",
    body: "What you flagged becomes the next lesson's starting point, and keeps showing up until it's actually resolved.",
  },
] as const;

/**
 * CFI-specific guide -- not the shared Student V2 GuideScreen, whose four
 * steps (Debrief/Understand/Train with Vector/Fly prepared) describe the
 * student's own loop, not the instructor's. Same V2 primitives, CFI-shaped
 * content.
 */
export default async function CfiV2ProfileGuidePage() {
  await getViewer();
  return (
    <Screen>
      <BackLink href="/cfi-v2/profile">Profile</BackLink>
      <PageTitle kicker="The short version">How AfterFlight works for CFIs</PageTitle>

      <Section title="The loop">
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

      <Section title="Where they saw it differently">
        <p className="text-[15px] leading-relaxed text-foreground-soft">
          A gap between your rating and the student&rsquo;s is information about the lesson, not a verdict on either
          of you. It never scores agreement, and it never ranks instructors.
        </p>
      </Section>

      <Section title="Your audio">
        <p className="text-[15px] leading-relaxed text-foreground-soft">
          Recordings are transcribed and then discarded. AfterFlight keeps the training record, not the recording.
        </p>
      </Section>
    </Screen>
  );
}
