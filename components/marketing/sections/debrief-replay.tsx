import Link from "next/link";
import { DebriefRecapDemo } from "@/components/marketing/debrief-recap-demo";
import { SectionHead } from "@/components/marketing/section-head";

/**
 * Debrief replay, using the real player.
 *
 * This started as a still card with a play icon that didn't play. A section
 * whose entire claim is "you can listen to this again" should not be a
 * picture of a button -- the recap is one of the few things on this page a
 * visitor can experience rather than read about, so it plays Mia's actual
 * recap audio.
 *
 * Led by the moment, not the mechanism: nobody chooses a training product
 * because it has text-to-speech. Attribution stays explicit ("Based on her
 * conversation with Jake") so a replay never sounds like the app inventing
 * feedback the instructor never gave.
 */
export function DebriefReplay() {
  return (
    <section className="bg-[#f4f5f6] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1100px]">
        <SectionHead
          eyebrow="Debrief replay"
          headline="Hear the important part again."
          body="After the debrief, AfterFlight turns the conversation into a short recap the student can replay on the drive home, or in the car park before the next lesson."
        />

        <DebriefRecapDemo showHeading={false} className="mt-14" />

        {/* The privacy claim is one click from the assertion, because its value
            is that it survives being checked. */}
        <p className="mx-auto mt-9 max-w-xl text-balance text-center text-sm leading-relaxed text-[#68717D]">
          Your audio is transcribed and then discarded. AfterFlight keeps the training record, not the recording &mdash;{" "}
          <Link href="/data-handling" className="underline underline-offset-2 hover:text-[#101727]">
            here&rsquo;s exactly how that works
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
