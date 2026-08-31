import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { appOrigin } from "@/lib/email";
import { DATA_HANDLING_FACTS } from "@/lib/consent";

export const metadata: Metadata = {
  title: "Recording, Retention & Deletion — AfterFlight",
  description:
    "AfterFlight never stores the recording. What is captured, what is kept, who can see it, and how to delete it.",
  alternates: appOrigin() ? { canonical: `${appOrigin()}/data-handling` } : undefined,
};

/**
 * The public half of /admin/data-handling.
 *
 * Exists because the question it answers -- "where does the audio live, and
 * what happens if a lawyer subpoenas it?" -- gets asked by a chief instructor
 * who has not signed up and cannot log in. An answer behind auth is not an
 * answer at the moment it is needed.
 *
 * The Q&A body is shared with the in-app page via DATA_HANDLING_FACTS so the
 * two cannot drift. If the retention logic changes and these sentences stop
 * being true, both pages are wrong together and get fixed together.
 */
export default function DataHandlingPage() {
  return (
    <LegalPage title="Recording, Retention & Deletion" updated="August 30, 2026">
      <LegalSection title="AfterFlight does not store the recording">
        <p>
          When a debrief is recorded, the audio is streamed from the browser to our transcription provider as it
          happens and is discarded as it goes. It is never written to AfterFlight&rsquo;s servers or database. There is
          no audio column, no recording archive, and nothing to export or produce &mdash; only the text.
        </p>
        <p>
          To be precise about what that does and does not mean: the audio does travel to the transcription provider in
          order to be transcribed. What it never becomes is a stored file that AfterFlight or your school holds.
        </p>
      </LegalSection>

      <LegalSection title="Straight answers">
        <div className="flex flex-col gap-5">
          {DATA_HANDLING_FACTS.map((fact) => (
            <div key={fact.question}>
              <p className="font-semibold text-[#101727]">{fact.question}</p>
              <p className="mt-1">{fact.answer}</p>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection title="Consent">
        <p>
          Consent is captured before recording begins, from the participant starting the debrief, and is stored with
          the person, the school, the timestamp, and the exact version of the consent text that was on screen. When the
          wording changes, previous acceptances keep pointing at the wording that was actually shown &mdash; so consent
          can be shown to have existed, in a specific form, at the time of any given recording.
        </p>
        <p>
          Consent can be withdrawn at any time. Withdrawal stops future recordings and is itself recorded; the earlier
          acceptance is marked rather than erased, because a record that quietly disappears proves nothing.
        </p>
      </LegalSection>

      <LegalSection title="What we do not build">
        <p>
          AfterFlight does not score instructors. It does not rate debrief quality, rank CFIs, or provide a dashboard
          for evaluating instructor performance from debrief content. Training patterns are analyzed by skill &mdash;
          an issue that recurs is reported as a property of the skill, with instructor names appearing only as context
          in a lesson timeline.
        </p>
        <p>
          This is a product commitment, not a preference: an instructor who believes a tool is grading them stops
          speaking freely into it, and an unguarded debrief is the only thing here worth capturing.
        </p>
      </LegalSection>

      <LegalSection title="Questions">
        <p>
          If you are evaluating AfterFlight for a school and need something in writing for your insurer or counsel,
          contact us and ask. We would rather answer a hard question early than have it surface after you have
          committed.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
