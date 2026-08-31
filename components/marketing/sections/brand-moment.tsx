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
    copy: "The details that mattered right after landing are easy to forget by tomorrow.",
  },
  {
    title: "Hard to practise",
    copy: "\u201cWork on landings\u201d isn\u2019t a study plan. Students often leave without knowing exactly what to do between flights.",
  },
  {
    title: "Easy to repeat",
    copy: "The same weak area can show up again and again without ever becoming the focus of between-flight training.",
  },
] as const;

export function BrandMoment() {
  return (
    <section className="relative flex min-h-[560px] flex-col items-center overflow-hidden bg-white px-6 py-20 sm:min-h-[680px] sm:py-24 lg:min-h-[860px]">
      <div className="absolute inset-0">
        <Image
          src="/images/marketing/ten-minutes-back.webp"
          alt=""
          fill
          className="object-cover"
          style={{ objectPosition: "center 55%", filter: "saturate(0.65) brightness(1.12)" }}
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.85) 22%, rgba(255,255,255,0.72) 48%, rgba(255,255,255,0.55) 68%, rgba(255,255,255,0.3) 85%, rgba(255,255,255,0.05) 100%)",
          }}
        />
      </div>

      <Reveal className="relative mx-auto max-w-3xl text-center">
        <p
          className="text-balance text-lg font-bold uppercase tracking-[0.2em] text-brand sm:text-xl"
          style={{ textShadow: "0 1px 8px rgba(255,255,255,0.9)" }}
        >
          The Problem
        </p>

        <p className="font-display mt-6 text-balance text-3xl font-bold leading-[1.05] text-[#101727] sm:text-[clamp(3rem,2.25rem+3vw,4.5rem)] sm:leading-[0.95]">
          The expensive part is the flight. <span className="text-brand">The learning has to continue after it.</span>
        </p>
        <p
          className="mx-auto mt-8 max-w-md text-balance text-lg text-[#4b545d] sm:max-w-2xl"
          style={{ textShadow: "0 1px 10px rgba(255,255,255,0.9)" }}
        >
          Your instructor gives you feedback after every lesson. But if you don&rsquo;t fully understand it,
          practise it, and carry it into the next flight, you can spend the next lesson{" "}
          <span className="text-brand">relearning the same things.</span>
        </p>
      </Reveal>

      <Reveal delay={300} className="relative mt-12 w-full max-w-2xl sm:mt-16">
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

      <Reveal delay={450} className="relative mt-14 grid w-full max-w-4xl grid-cols-1 gap-6 sm:mt-16 sm:grid-cols-3">
        {PROBLEMS.map((p, i) => (
          <div
            key={p.title}
            className="rounded-2xl border border-black/[0.06] bg-white/85 p-6 backdrop-blur-sm sm:p-7"
          >
            <p className="font-display text-sm font-extrabold tabular-nums tracking-[0.1em] text-brand">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="font-display mt-2 text-balance text-lg font-bold uppercase tracking-wide text-[#101727]">
              {p.title}
            </h3>
            <p className="text-pretty mt-2.5 text-base leading-relaxed text-[#4b545d]">{p.copy}</p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
