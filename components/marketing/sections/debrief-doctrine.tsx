import Image from "next/image";
import { Reveal } from "@/components/marketing/reveal";

export function DebriefDoctrine() {
  return (
    <section className="relative flex min-h-[420px] items-center overflow-hidden bg-[#0c1220] px-6 py-16 sm:py-20">
      <div className="absolute inset-0">
        <Image
          src="/images/marketing/f35-doctrine.webp"
          alt=""
          fill
          className="object-cover"
          style={{ objectPosition: "center 45%" }}
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,14,26,0.88) 0%, rgba(10,14,26,0.82) 45%, rgba(10,14,26,0.94) 100%)",
          }}
        />
      </div>

      <Reveal className="relative mx-auto max-w-3xl text-center">
        <span className="font-display text-4xl leading-none text-brand/70" aria-hidden="true">
          &ldquo;
        </span>
        <p className="font-display mt-2 text-balance text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
          A structured debrief is the single most effective way to accelerate learning and improve performance.
        </p>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-white/60">
          Brandon Williams <span className="font-normal normal-case text-white/45">&mdash; U.S. Air Force Fighter Pilot &amp; Instructor</span>
        </p>
      </Reveal>
    </section>
  );
}
