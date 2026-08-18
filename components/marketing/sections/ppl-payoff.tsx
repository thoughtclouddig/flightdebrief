import Image from "next/image";
import { Reveal } from "@/components/marketing/reveal";

const GALLERY = [
  {
    src: "/images/marketing/checkride-family-piper.webp",
    alt: "A newly certificated student pilot holding her certificate, flanked by her proud parents in front of a Piper on the ramp",
  },
  {
    src: "/images/marketing/checkride-celebration.webp",
    alt: "A newly certificated student pilot celebrating with a fist pump, CFI and DPE nearby on the ramp",
  },
  {
    src: "/images/marketing/checkride-family-cessna.webp",
    alt: "A newly certificated student pilot holding her certificate, flanked by her parents and DPE in front of a Cessna on the ramp",
  },
  {
    src: "/images/marketing/checkride-hug-diamond.webp",
    alt: "A newly certificated pilot embracing her CFI on the ramp, certificate in hand, beside a Diamond DA40",
  },
  {
    src: "/images/marketing/ppl-checkride-wide.webp",
    alt: "A newly certificated student pilot holding his Temporary Airman Certificate, flanked by his CFI and DPE on the ramp",
  },
] as const;

export function PplPayoff() {
  return (
    <section className="bg-white pb-28 pt-20 sm:pb-36 sm:pt-28">
      <Reveal>
        <div className="px-6 text-center">
          <p className="font-display text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
            Every flight <span className="text-brand">gets you closer.</span>
          </p>
          <p className="mt-3 text-balance text-[#68717D]">Better debriefs. Better preparation. Better pilots.</p>
        </div>

        {/* Content is duplicated so the loop point (-50%) is seamless; the marquee is paused under prefers-reduced-motion instead of hidden, since the photos themselves aren't decorative. */}
        <div className="mt-10 overflow-hidden">
          <div className="flex w-max animate-[marquee-slide_50s_linear_infinite] gap-4 px-6 hover:[animation-play-state:paused] motion-reduce:animate-none sm:gap-6">
            {[...GALLERY, ...GALLERY].map((img, i) => (
              <div
                key={`${img.src}-${i}`}
                className="relative aspect-[4/3] w-[86vw] shrink-0 overflow-hidden rounded-2xl sm:w-[60vw] md:w-[420px] lg:w-[480px]"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 480px, (min-width: 768px) 420px, (min-width: 640px) 60vw, 86vw"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-lg text-center">
          <div className="mx-auto h-px w-10 bg-brand/40" aria-hidden="true" />
          <p className="font-display mt-6 text-balance text-xl italic leading-snug text-[#101727] sm:text-2xl">
            <span className="text-brand" aria-hidden="true">
              &ldquo;
            </span>
            Learn to think quickly. Be accurate from the beginning.
            <span className="text-brand" aria-hidden="true">
              &rdquo;
            </span>
          </p>
          <p className="mt-3 text-sm font-semibold text-[#4b545d]">Bob Hoover</p>
        </div>
      </Reveal>
    </section>
  );
}
