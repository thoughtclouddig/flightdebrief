import { BookOpen, Mail, MessageSquare } from "lucide-react";
import { BackLink, Card, PageTitle, QuietRow, Screen, Section } from "@/components/student/ui";

/**
 * Support -- shared between app/prototype/vector/profile/support/page.tsx
 * and app/v2/profile/support/page.tsx.
 *
 * Answers first, contact second. Most of what reaches a support inbox for
 * this product is one of the three questions below, and a student who gets
 * their answer here never has to wait for a reply.
 */
const FAQ = [
  {
    q: "My instructor doesn't want to use the app.",
    a: "They don't have to install anything or fill anything in. You hold your phone and hit record while they give the debrief they were going to give anyway. That's the whole ask.",
  },
  {
    q: "AfterFlight got something wrong in my debrief.",
    a: "Open the debrief and edit it. What you confirm is what everything downstream runs on, so a correction there fixes your progress and your next-flight prep too.",
  },
  {
    q: "Is my instructor being recorded without knowing?",
    a: "No. Recording is something you start in front of them, and the audio is transcribed and then discarded — AfterFlight keeps the training record, not the recording.",
  },
] as const;

export function SupportScreen({ backHref, guideHref, trainHref }: { backHref: string; guideHref: string; trainHref: string }) {
  return (
    <Screen>
      <BackLink href={backHref}>Profile</BackLink>
      <PageTitle kicker="We answer within a day">Support</PageTitle>

      <Section title={<>Common questions</>} flush>
        <div className="flex flex-col gap-3">
          {FAQ.map((f) => (
            <Card key={f.q}>
              <p className="text-[17px] font-medium leading-snug text-foreground">{f.q}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">{f.a}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={<>Still stuck</>}>
        <div className="flex flex-col">
          <QuietRow
            href="mailto:support@getafterflight.com"
            label={
              <span className="flex items-center gap-3">
                <Mail className="size-[18px] shrink-0 text-foreground-faint" aria-hidden />
                Email support
              </span>
            }
            meta="1 day"
          />
          <QuietRow
            href={guideHref}
            label={
              <span className="flex items-center gap-3">
                <BookOpen className="size-[18px] shrink-0 text-foreground-faint" aria-hidden />
                How AfterFlight works
              </span>
            }
          />
          <QuietRow
            href={trainHref}
            label={
              <span className="flex items-center gap-3">
                <MessageSquare className="size-[18px] shrink-0 text-foreground-faint" aria-hidden />
                Ask Vector about your training
              </span>
            }
          />
        </div>
      </Section>

      <p className="text-[13px] leading-relaxed text-foreground-faint">
        Vector can answer questions about your flying. For anything about your account, billing or your school, email
        us &mdash; a person reads it.
      </p>
    </Screen>
  );
}
