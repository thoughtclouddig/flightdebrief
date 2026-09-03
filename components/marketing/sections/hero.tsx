import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { CtaLink } from "@/components/marketing/cta-link";
import { DebriefSummaryMockupCard } from "@/components/marketing/product-mockups";

// Four, not three. Three left an orphan on the second row of the 2-up grid;
// four fills both rows and reads as a set. "Show up prepared" is the existing
// hero promise restated as a benefit, not a new claim.
//
// Three words each, and that is a constraint rather than a coincidence: the
// grid gives each column about 244px, and the first draft of the fourth
// ("Show up prepared every lesson") was the only one long enough to wrap.
const BENEFITS = [
  "Nothing gets forgotten",
  "Get better faster",
  "Show up prepared",
  "Waste fewer flight hours",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-24 sm:pt-28 lg:min-h-[680px] lg:pb-0">
      <div className="relative mx-auto max-w-[1320px] px-6">
        {/* max-w-xl was 576px, which is what actually held the headline --
            not the photograph. The photograph is absolutely positioned, so it
            never constrained this column; it only decides how much clear space
            there is to grow into. At lg:w-[60%] there is ~660px of it. */}
        <div className="relative z-10 max-w-xl lg:py-16">
          {/* One line, and sized by measurement rather than by eye. Uppercase
              at 0.16em tracking, this string renders 630px wide at 18px
              against a 576px column, so it wrapped. 15px puts it at ~525px --
              about 50px of slack, which is enough to survive the fallback face
              before Archivo loads. It still wraps below sm, where no readable
              size fits 45 characters on a phone. */}
          {/* Measured: at 15px with 0.16em tracking this string is 443px wide and
              the phone column is 327px, so it wrapped to two lines on every
              phone. Tracking is what makes it expensive -- 0.16em adds 74px on
              its own -- so the phone gets a smaller size AND most of the
              tracking back, which lands at 317px. Above sm the column is wide
              enough for the full treatment.

              Verified one line at 320 as well, where the column is 272px and
              the rendered text is exactly 272. A probe span measured this at
              317px and predicted a wrap; the probe over-reads, because
              letter-spacing applies after the final character and uppercasing
              in CSS is not identical to measuring a pre-uppercased string.
              Trust the rendered element over the probe. */}
          <p className="text-balance text-[12px] font-bold uppercase tracking-[0.06em] text-brand sm:text-[15px] sm:tracking-[0.16em]">
            Better training between flights
          </p>
          {/* Reverted to the original two-line promise on request. Comments
              above described the "checkride sooner" and "Prepare better"
              headlines this replaces; both are gone, so their measurements no
              longer apply and are removed rather than left to mislead the
              next edit.

              Sized fresh for this copy, not reused from history: the old
              clamp ceilings (2.875rem / 3rem) were cut for longer lines
              ("checkride sooner --", "between flights.") in the same 576px
              column. "Make every flight" is shorter, so it tolerates more
              size before wrapping -- measured at 3.25rem (52px) it still
              holds one line with margin at 576px, and 8.5vw keeps the mobile
              floor a step above the previous headline's. */}
          {/* lg+ is flat 2.8125rem (45px), pushed up from 40px because 40
              still read weak -- twice. The binding case moved once the photo
              narrowed further at lg: it is no longer 1024 (509px clear there,
              49px max) but the XL HANDOFF ITSELF -- 1280px, where the photo
              jumps from 48% back to 60% and clearance drops from 641px to
              488px in one step. That gives a 47px ceiling, so 45px leaves
              real margin (~30px) exactly at the one point margin can vanish,
              and far more everywhere else. Flat, not vw-scaled, for the same
              reason as before: the photo cap keeps clearance from shrinking
              as the viewport grows, so nothing forces the size down again
              past this point. */}
          <h1
            className="font-display mt-4 max-w-2xl text-[clamp(1.625rem,8.5vw,2.5rem)] lg:text-[2.8125rem] font-extrabold leading-[1.05] tracking-[-0.025em] text-[#101727]"
            style={{ textTransform: "none" }}
          >
            <span className="block">Make every flight</span>
            <span className="block">
              build on <span className="text-brand">the last.</span>
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-[#414B57]">
            AfterFlight turns each lesson into a personalized plan for what to review, practice, and focus on
            next &mdash; so you show up prepared, avoid relearning, and build proficiency faster.
          </p>

          {/* Grid, not flex-wrap. Wrapping packed each row by content width, so
              the second column began wherever the first item happened to end
              and none of the four lined up. Two even columns align them. */}
          <ul className="mt-6 grid max-w-xl grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-center gap-1.5 text-sm font-medium text-[#101727]">
                <CheckCircle2 className="size-4 shrink-0 text-brand" />
                {benefit}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-stretch gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CtaLink href="/signup">Try AfterFlight Free</CtaLink>
              <CtaLink href="#overview" variant="secondary" className="whitespace-nowrap">
                See How It Works
              </CtaLink>
            </div>

            {/* The recording claim used to sit here, wrapped under the CTA
                where it read as fine print on the price. It now lives beside
                the recorder itself, in the Debrief Replay section, which is
                where someone is actually wondering about it. */}
            <p className="text-balance text-center text-sm font-medium text-[#414B57] sm:text-left">
              No credit card &middot; Free to start
            </p>
          </div>
        </div>

      </div>

      {/* One responsive hero image serves both layouts, avoiding an eager hidden desktop duplicate on mobile. */}
      {/* Width is no longer a flat 60% from lg. That let the photo grow
          without bound as the viewport widens, which is what forced the
          headline's size down for every width, not just the tight one: text
          sits inside the centered, 1320px-capped container, but the photo is
          positioned against the section's full, uncapped width, so their
          clearance shrinks as the viewport grows past 1320 with no floor.

          48% at lg (1024-1279), narrower than the 55% first tried -- the
          headline read too small at 40px and the room to grow further was
          here, not at 60%+ where the ceiling was already generous. 60% from
          xl matches what shipped before.
          900px flat from 2xl stops the photo growing at all past that point,
          which is what removes the ultra-wide case entirely -- clearance
          grows without bound above 2xl once the photo's own width is fixed. */}
      <div className="relative mx-6 mt-12 aspect-[4/3] overflow-visible lg:absolute lg:inset-y-0 lg:right-0 lg:mx-0 lg:mt-0 lg:w-[48%] xl:w-[60%] 2xl:w-[900px] lg:aspect-auto">
        <div className="absolute inset-0 overflow-hidden rounded-3xl lg:rounded-none">
          <Image
            src="/images/marketing/hero-debrief-tablet.webp"
            alt="A student pilot and CFI reviewing a flight debrief together on a tablet beside the aircraft"
            fill
            priority
            className="object-cover"
            sizes="(min-width: 1024px) 60vw, 100vw"
          />
          {/* The fade has to START opaque, not at 60% -- from-white/60 left
              40% of the photograph showing at its own left edge, which is
              exactly where the image meets the white page, and that read as
              a visible border. Full white for the first stop covers it.

              170px (200 at xl) was a safe first cut after the crop reverted
              to centered, but tighter than it needed to be: with the subject
              centered rather than shifted left, there is real background --
              sky, the plane's tail -- between the seam and the student, not
              just a one-pixel edge to hide. Re-measured against that space:
              his hairline sits roughly 270px into the photo, so 220px (260 at
              xl) still clears him with margin while reaching further than the
              minimum. A middle stop softens the curve instead of cutting
              straight from solid to transparent -- the earlier hard-edge
              complaint was this same 2-stop shape at a narrower width. */}
          <div className="absolute inset-y-0 left-0 hidden w-[220px] bg-gradient-to-r from-white from-15% via-white/45 via-55% to-transparent lg:block xl:w-[260px]" />
        </div>
        <DebriefSummaryMockupCard className="absolute -bottom-10 right-4 hidden w-[340px] lg:block xl:right-8" />
      </div>
      {/* In normal flow (not absolute) on mobile so the card's real height sets the
          section's height -- an absolutely-positioned card here previously needed a
          hardcoded spacer below it that never matched the card's actual content height. */}
      <DebriefSummaryMockupCard className="relative z-10 -mt-16 mx-auto mb-10 w-[min(320px,88%)] lg:hidden" />
    </section>
  );
}
