import Link from "next/link";
import { Headphones, Play } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { SectionHead } from "@/components/marketing/section-head";

/**
 * Debrief replay.
 *
 * Led by the moment, not the mechanism -- nobody chooses a training product
 * because it has text-to-speech. Attribution stays explicit ("From today's
 * debrief with Jake") so a replay never sounds like the app inventing
 * feedback the instructor never gave.
 */
export function DebriefReplay() {
  return (
    <section className="bg-[#f4f5f6] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1100px]">
        <SectionHead
          eyebrow="Debrief replay"
          headline="Hear the important part again."
          body="Listen back to the key takeaways from your instructor's debrief on the drive home, or in the car park before your next lesson."
        />

        <Reveal delay={120} className="mx-auto mt-14 max-w-[620px]">
          <div className="rounded-[28px] border border-black/[0.06] bg-white px-7 py-7 shadow-[0_20px_44px_-24px_rgba(16,23,39,0.24)] sm:px-9">
            <div className="flex items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand text-[#142033]">
                <Play className="size-5 fill-current" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="font-display text-xl font-bold text-[#101727]">Today&rsquo;s debrief</p>
                <p className="mt-0.5 text-base text-[#68717D]">With Jake · 1:12</p>
              </div>
              <Headphones className="ml-auto size-5 shrink-0 text-[#68717D]" aria-hidden />
            </div>

            <blockquote className="mt-7 border-l-2 border-brand/60 pl-4">
              <p className="text-pretty text-lg italic leading-relaxed text-[#4b545d]">
                &ldquo;Centerline control was much better today. Next time I want to get you stabilized earlier, so
                you&rsquo;re not trying to fix the speed at the threshold.&rdquo;
              </p>
              <footer className="mt-2.5 text-sm font-medium text-[#68717D]">From today&rsquo;s debrief with Jake</footer>
            </blockquote>
          </div>
        </Reveal>

        {/* The privacy claim is one click from the assertion, because its value
            is that it survives being checked. */}
        <p className="mx-auto mt-9 max-w-xl text-balance text-center text-sm leading-relaxed text-[#68717D]">
          Your audio is transcribed and then discarded. AfterFlight keeps the training record, not the recording —{" "}
          <Link href="/data-handling" className="underline underline-offset-2 hover:text-[#101727]">
            here&rsquo;s exactly how that works
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
