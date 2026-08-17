import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

export function BrandMoment() {
  return (
    <section className="relative flex min-h-[860px] items-center overflow-hidden bg-white px-6 py-24">
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
              "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.97) 22%, rgba(255,255,255,0.95) 48%, rgba(255,255,255,0.6) 62%, rgba(255,255,255,0.08) 100%)",
          }}
        />
      </div>

      <Reveal className="relative mx-auto max-w-3xl text-center">
        <p
          className="text-xs font-bold uppercase tracking-[0.2em] text-brand"
          style={{ textShadow: "0 1px 8px rgba(255,255,255,0.9)" }}
        >
          The Problem
        </p>

        <p className="font-display mt-6 text-balance text-5xl font-bold leading-[0.95] text-[#101727] sm:text-6xl lg:text-7xl">
          The most valuable ten minutes <span className="text-brand">of a lesson disappear.</span>
        </p>
        <p
          className="mx-auto mt-8 max-w-md text-pretty text-lg text-[#4b545d]"
          style={{ textShadow: "0 1px 10px rgba(255,255,255,0.9)" }}
        >
          You land. You talk it through. Your instructor tells you what worked, what didn&rsquo;t, and what to
          fix next time. Then the details start to fade.
        </p>

        <a
          href="#how-it-works"
          className="mt-14 inline-flex items-center gap-2.5 rounded-full border border-brand/25 bg-white/70 px-5 py-2.5 text-sm font-bold uppercase tracking-[0.16em] text-brand shadow-[0_2px_12px_rgba(240,118,33,0.12)] backdrop-blur-sm transition-colors hover:border-brand/50 hover:bg-white"
        >
          See how we solve it
          <ArrowDown className="size-4 animate-bounce" />
        </a>
      </Reveal>
    </section>
  );
}
