import { AudioPrivacyNote } from "@/components/marketing/audio-privacy-note";
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
          headline="It starts with what your instructor said."
          body="AfterFlight captures what happened in the lesson and what your instructor wants you working on — the foundation for everything that comes next. It also becomes a short recap you can replay on the drive home."
        />

        <DebriefRecapDemo showHeading={false} className="mt-14" />

        {/* The privacy claim is one click from the assertion, because its value
            is that it survives being checked -- but the click now opens a
            dialog rather than sending the reader to a legal page they have to
            navigate back from. */}
        <AudioPrivacyNote />

      </div>
    </section>
  );
}
