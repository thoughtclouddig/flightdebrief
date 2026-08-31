import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { appOrigin } from "@/lib/email";

export const metadata: Metadata = {
  title: "CFI Quickstart — AfterFlight",
  description: "Tap record. Give the debrief you were already going to give. Tap stop. That is the whole workflow.",
  alternates: appOrigin() ? { canonical: `${appOrigin()}/for-instructors-quickstart` } : undefined,
};

/**
 * One page, on purpose.
 *
 * Its job is not to teach the product -- it is to demonstrate how little
 * there is to learn, to an instructor who has been handed software before
 * and quietly kept using their knee board. If this page ever needs a second
 * screen's worth of instructions, that is a finding about the product, not a
 * reason to write more here.
 */
export default function CfiQuickstartPage() {
  return (
    <LegalPage title="CFI Quickstart" updated="August 30, 2026">
      <LegalSection title="The whole workflow">
        <p className="text-lg text-[#101727]">Tap record. Talk. Tap stop. Walk away.</p>
        <p>
          That is not a simplification for a marketing page &mdash; it is the entire required interaction. There is no
          grid to confirm, no AI output to approve, no signature, and nothing to type. Everything else in AfterFlight
          is built from what you said.
        </p>
      </LegalSection>

      <LegalSection title="What to say">
        <p>
          Give the debrief you were already going to give. Talk to the student, not to the app &mdash; the recording is
          a byproduct of a conversation you were having anyway, and it works best when it sounds like one.
        </p>
        <p>
          You do not need to name maneuvers in a particular way, hit keywords, or structure it. Ninety seconds of
          normal speech is plenty. If you mention what went well, what needs work, and what you want next time, the
          record writes itself.
        </p>
      </LegalSection>

      <LegalSection title="What happens after you leave">
        <p>
          The conversation becomes a structured record: what you worked on, what went well, what needs more work, your
          guidance quoted and attributed to you, and a focus for the next flight. The student gets it back as text and
          as a short audio recap they can listen to on the drive home.
        </p>
        <p>
          Anything left unresolved carries into the next lesson automatically, so you are not re-reading old notes to
          remember where you left off &mdash; and neither is whoever flies with them next.
        </p>
      </LegalSection>

      <LegalSection title="What it does not do">
        <p>
          It does not grade you. AfterFlight has no debrief-quality score, no instructor rating, no CFI comparison, and
          no dashboard for evaluating instructors from debrief content. When a weakness keeps recurring, it is reported
          as a property of the skill; your name appears only as context on a timeline.
        </p>
        <p>
          It also does not keep the recording. Audio is transcribed as it happens and discarded &mdash; there is no
          stored file of you teaching. See{" "}
          <a href="/data-handling" className="underline">
            recording, retention &amp; deletion
          </a>{" "}
          for the specifics.
        </p>
      </LegalSection>

      <LegalSection title="If a student flies with someone else">
        <p>
          The next instructor opens one page: where the student is, what you wanted continued, what is still
          unresolved, anything you and the student saw differently, and a suggested starting point. That handoff
          normally happens as a hallway conversation, if it happens at all. This is the same conversation, written
          before it is needed.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
