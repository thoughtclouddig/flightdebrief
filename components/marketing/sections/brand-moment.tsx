import Image from "next/image";
import { Reveal } from "@/components/marketing/reveal";

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
          Too much of the debrief <span className="text-brand">gets lost.</span>
        </p>
        <p
          className="mx-auto mt-8 max-w-md text-balance text-lg text-[#4b545d] sm:max-w-2xl"
          style={{ textShadow: "0 1px 10px rgba(255,255,255,0.9)" }}
        >
          Every flight ends with a conversation that matters. But there&rsquo;s no guarantee the right things{" "}
          <span className="text-brand">get discussed, remembered, or carried into the next lesson.</span>
        </p>
      </Reveal>

      <Reveal delay={300} className="relative mt-12 w-full max-w-2xl sm:mt-16">
        <div
          className="overflow-hidden rounded-xl border border-black/[0.06] bg-black/5 shadow-[0_16px_40px_-12px_rgba(16,23,39,0.25)]"
          style={{ position: "relative", height: 0, paddingBottom: "56.25%" }}
        >
          <iframe
            className="sproutvideo-player"
            src="https://videos.sproutvideo.com/embed/ee9adcbb161ee1c664/9f8eb983a05fd24e?playerColor=ff6f08&playerTheme=light&showControls=false"
            style={{ position: "absolute", width: "100%", height: "100%", left: 0, top: 0 }}
            frameBorder={0}
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            title="Video Player"
          />
        </div>
      </Reveal>
    </section>
  );
}
