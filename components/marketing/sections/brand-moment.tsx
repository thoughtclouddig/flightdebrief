import Image from "next/image";
import { Reveal } from "@/components/marketing/reveal";

/**
 * Three ways training value leaks between lessons.
 *
 * Written at the student, never at the instructor: the CFI gave the feedback,
 * and what happens to it afterwards is the gap this product fills.
 */
const PROBLEMS = [
  {
    title: "Hard to remember",
    copy: "The details that mattered right after landing are easy to forget by the next lesson — especially if it is with a different instructor.",
  },
  {
    title: "Hard to practice",
    copy: "\u201cWork on landings\u201d isn\u2019t a study plan. Students often leave without knowing exactly what to do between flights.",
  },
  {
    title: "Easy to repeat",
    copy: "The same weak area can show up again and again without ever becoming the focus of between-flight training.",
  },
] as const;

export function BrandMoment() {
  return (
    <section className="relative flex flex-col items-center overflow-hidden bg-white px-6 py-20 sm:py-24">
      <div className="absolute inset-0">
        <Image
          src="/images/marketing/ten-minutes-back.webp"
          alt=""
          fill
          className="object-cover"
          style={{ objectPosition: "center 55%", filter: "saturate(0.65) brightness(1.12)" }}
          sizes="100vw"
        />
        {/*
         * Bright at both ends, thin in the middle.
         *
         * The original ramp went white-to-clear top-to-bottom, which was right
         * when the section ended at the video. The three problem lines now sit
         * below it, in what used to be the clear end of the ramp -- dark ramp
         * asphalt behind #4b545d body text, which is unreadable rather than
         * merely low-contrast. The scrim now thins to its minimum around the
         * video, where the photograph should be doing the work, and recovers
         * to near-opaque under the copy beneath it.
         */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.85) 18%, rgba(255,255,255,0.66) 34%, rgba(255,255,255,0.48) 50%, rgba(255,255,255,0.6) 62%, rgba(255,255,255,0.82) 74%, rgba(255,255,255,0.93) 84%, rgba(255,255,255,0.97) 100%)",
          }}
        />
      </div>

      <Reveal className="relative mx-auto max-w-3xl text-center lg:max-w-[1040px]">
        <p
          className="text-balance text-lg font-bold uppercase tracking-[0.2em] text-brand sm:text-xl"
          style={{ textShadow: "0 1px 8px rgba(255,255,255,0.9)" }}
        >
          The Problem
        </p>

        {/*
         * One question, split so the two lines are near equal -- 21 characters
         * against 18. Balance on its own put the break after "feel", which is
         * a legal break and a lopsided one: 26 against 13, with the second
         * line half the width of the first.
         *
         * Explicit spans rather than a hidden <br> or a tuned ch cap: a br
         * toggled with display utilities relies on browser handling of a
         * display-switched line break, and a character cap only produces this
         * break until someone edits a word. Blocks state the intent.
         */}
        <p className="font-display mx-auto mt-6 max-w-[22ch] text-balance text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-[#101727] sm:text-[clamp(2.5rem,1.9rem+2.5vw,3.75rem)] sm:leading-[1.0] lg:max-w-none lg:text-[clamp(2.5rem,4.5vw,3rem)]">
          <span className="lg:block">Why does every flight</span>{" "}
          <span className="lg:block">
            feel like a <span className="text-brand">reset?</span>
          </span>
        </p>
        <p
          className="mx-auto mt-8 max-w-md text-balance text-lg text-[#4b545d] sm:max-w-2xl"
          style={{ textShadow: "0 1px 10px rgba(255,255,255,0.9)" }}
        >
          What you learned, what needs work, and what to focus on next gets lost between lessons. So instead of
          building on the last flight, too much of the next one is{" "}
          <span className="text-brand">spent catching up.</span>
        </p>
      </Reveal>

      <Reveal delay={300} className="relative mt-12 w-full max-w-2xl sm:mt-14">
        <div
          className="overflow-hidden rounded-xl border border-black/[0.06] bg-black/5 shadow-[0_16px_40px_-12px_rgba(16,23,39,0.25)]"
          style={{ position: "relative", height: 0, paddingBottom: "56.25%" }}
        >
          <iframe
            className="sproutvideo-player"
            src="https://videos.sproutvideo.com/embed/ee9adcbb161ee1c664/9f8eb983a05fd24e?playerColor=ff6f08&playerTheme=light&showControls=false&endFrame=posterFrame"
            style={{ position: "absolute", width: "100%", height: "100%", left: 0, top: 0 }}
            frameBorder={0}
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            title="Video Player"
          />
        </div>
      </Reveal>

      {/*
       * Deliberately small and chrome-free. These three lines exist to name
       * the problem the video is about, not to compete with it -- as cards
       * they were three more objects fighting the one thing this section is
       * built around. A rule and a numeral is enough structure.
       */}
      <Reveal delay={450} className="relative mt-12 w-full max-w-3xl sm:mt-14">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
          {PROBLEMS.map((p, i) => (
            <div key={p.title} className="border-t border-[#101727]/12 pt-4">
              <dt className="flex items-baseline gap-2">
                <span className="font-display text-xs font-extrabold tabular-nums tracking-[0.1em] text-brand">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-[15px] font-bold uppercase tracking-wide text-[#101727]">
                  {p.title}
                </span>
              </dt>
              <dd className="text-balance mt-1.5 text-[15px] leading-relaxed text-[#4b545d]">{p.copy}</dd>
            </div>
          ))}
        </dl>
      </Reveal>

    </section>
  );
}
