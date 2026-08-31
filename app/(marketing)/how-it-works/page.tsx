import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { appOrigin } from "@/lib/email";

export const metadata: Metadata = {
  title: "How AfterFlight Works — For School Owners",
  description:
    "What gets captured, who sees what, what happens when an instructor leaves, and what AfterFlight deliberately does not do.",
  alternates: appOrigin() ? { canonical: `${appOrigin()}/how-it-works` } : undefined,
};

/**
 * Written for the person who has to answer for the decision -- owner or
 * chief instructor -- and reads the way that person actually evaluates
 * software: what does it cost my instructors, what does it expose me to,
 * and what is it not.
 *
 * Deliberately does not describe scheduling, dispatch, billing or Part 141
 * recordkeeping, because AfterFlight does not do those and a page that
 * gestures at them invites a comparison against products that do.
 */
export default function HowItWorksPage() {
  return (
    <LegalPage title="How AfterFlight Works" updated="August 30, 2026">
      <LegalSection title="The short version">
        <p>
          Your instructors already debrief. AfterFlight listens to that conversation, turns it into a structured
          training record, and makes sure what mattered in one lesson reaches the next one &mdash; including when the
          next lesson is with a different instructor.
        </p>
        <p>
          It is not a scheduling system, a dispatch system, a billing system, or a Part 141 recordkeeping platform. It
          sits alongside whatever you already use for those.
        </p>
      </LegalSection>

      <LegalSection title="What it costs your instructors">
        <p>
          Ninety seconds, and no typing. Tap record, give the debrief, tap stop. There is no grading grid to complete,
          no AI output to review and approve, and no signature step. This matters more than any feature: software that
          asks instructors for unpaid minutes after a lesson gets quietly abandoned, and yours are already late for the
          next student.
        </p>
      </LegalSection>

      <LegalSection title="What gets captured">
        <p>
          From one conversation: what was worked on, what went well, what needs work, the instructor&rsquo;s guidance
          quoted and attributed, action items, a focus for the next flight, and relevant study references. The student
          also gets a short audio recap of their own debrief.
        </p>
        <p>
          Where your syllabus is structured, students and instructors can each assess the same tasks independently.
          When they see the same flight differently, AfterFlight shows both views side by side &mdash; not as a
          disagreement to settle, but as the most useful thing in the debrief to talk about.
        </p>
      </LegalSection>

      <LegalSection title="Who sees what">
        <p>
          Students see their own records. Instructors see the students they train. Administrators see their school.
          Records are scoped to one organization and are never shared between schools.
        </p>
      </LegalSection>

      <LegalSection title="What happens when an instructor leaves">
        <p>
          This is the part most schools handle as a conversation between the departing CFI and the next one, if the two
          overlap at all. AfterFlight produces the same handoff as a page: where the student is, what the previous
          instructor wanted continued, what is still unresolved, any perception gap between student and instructor, and
          a suggested starting point for the next flight.
        </p>
        <p>
          It also notices when a weakness has persisted across a change of instructor &mdash; something no single
          instructor is in a position to see, because each of them only has their own lessons. That is reported as a
          property of the skill: a problem that has outlived two teachers is usually about the skill, not about either
          of them.
        </p>
      </LegalSection>

      <LegalSection title="Recording, and what we keep">
        <p>
          AfterFlight does not store the recording. Audio is transcribed as it happens and discarded &mdash; there is
          no archive to produce, export, or subpoena. Consent is captured before recording starts and stamped with the
          version of the text the person actually saw. Transcripts age out on a retention schedule you control, while
          the structured training record is kept, so a student never loses their history.
        </p>
        <p>
          The specifics, in writing, are at{" "}
          <a href="/data-handling" className="underline">
            recording, retention &amp; deletion
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="What we deliberately do not build">
        <p>
          No instructor scorecards. No debrief-quality scores, no CFI rankings, and no dashboard for evaluating
          instructors from debrief content. We are asked for this and we decline, for a practical reason as much as a
          principled one: an instructor who believes a tool is grading them stops speaking freely into it, and an
          unguarded debrief is the only thing here worth capturing.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
