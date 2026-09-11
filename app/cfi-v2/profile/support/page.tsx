import { BookOpen } from "lucide-react";
import { getViewer } from "@/lib/viewer";
import { BackLink, Card, PageTitle, QuietRow, Screen, Section } from "@/components/student/ui";
import { SupportContactForm } from "@/components/cfi-v2/support-contact-form";

export const dynamic = "force-dynamic";

const FAQ = [
  {
    q: "What happens to the recording?",
    a: "It's transcribed and analyzed, then discarded. What's saved to the student's training history is the transcript and the resulting debrief -- not the audio itself.",
  },
  {
    q: "Why don't I see a single score or ranking?",
    a: "AfterFlight tracks training continuity, not instructor performance. There's no student-outcome score, agreement rate, or ranking anywhere in the product.",
  },
] as const;

/**
 * CFI-specific support -- not the shared Student V2 SupportScreen, whose FAQ
 * (student's instructor not wanting to use the app, correcting a debrief,
 * being recorded without knowing) answers a student's questions, not a
 * CFI's. Same "answers first, contact second" shape and the same real
 * support mailbox.
 */
export default async function CfiV2ProfileSupportPage() {
  await getViewer();
  return (
    <Screen>
      <BackLink href="/cfi-v2/profile">Profile</BackLink>
      <PageTitle kicker="We answer within a day">Support</PageTitle>

      <Section title="Common questions" flush>
        <div className="flex flex-col gap-3">
          {FAQ.map((f) => (
            <Card key={f.q}>
              <p className="text-[17px] font-medium leading-snug text-foreground">{f.q}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">{f.a}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Still stuck">
        <div className="flex flex-col">
          <SupportContactForm context="CFI" />
          <QuietRow
            href="/cfi-v2/profile/guide"
            label={
              <span className="flex items-center gap-3">
                <BookOpen className="size-[18px] shrink-0 text-foreground-faint" aria-hidden />
                How AfterFlight works for CFIs
              </span>
            }
          />
        </div>
      </Section>
    </Screen>
  );
}
