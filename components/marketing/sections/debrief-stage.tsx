import type { ReactNode } from "react";
import { PlaneTakeoff } from "lucide-react";
import Image from "next/image";
import { AudioPrivacyNote } from "@/components/marketing/audio-privacy-note";
import { DebriefRecapDemo } from "@/components/marketing/debrief-recap-demo";
import { DebriefStageRail } from "@/components/marketing/debrief-stage-rail";
import { Reveal } from "@/components/marketing/reveal";
import { VectorDemo } from "@/components/marketing/vector-demo";

/**
 * PROTOTYPE -- the Debrief stage as one band with a pinned identity.
 *
 * Perception Gap, Debrief Replay and Vector were three sibling sections, each
 * with its own centered heading and its own 24-32 unit of vertical padding. As
 * siblings they read as three unrelated features that happen to be adjacent;
 * the page never said they were one thing. Here they are three modules of one
 * stage, with DEBRIEF held in a sticky rail beside them so the parent is
 * visible the whole way down.
 *
 * The thing being tested is whether "one stage, three moments" survives
 * without flattening into one long generic block. What keeps them distinct is
 * mostly not chrome:
 *
 *  - Each module already owns a different KIND of surface. Photographs, an
 *    audio player on a raised white card, and a chat transcript. Those three
 *    look nothing alike, and that does more work than any divider would.
 *  - Ground alternates base / raised / base, so module two is physically
 *    lifted off the page between two that sit flat on it.
 *  - Module heads are left-aligned rather than centered. Centered heads are
 *    what made these read as three separate sections in the first place, and
 *    the rail occupies the left, so a centered head would also sit off the
 *    content column's own axis.
 *
 * Sequence is deliberately NOT numbered. 01/02/03 in the rail and again on
 * every head was four numerals of chrome doing what the rail's own order,
 * active rule and weight already do, and stepped numerals on a marketing page
 * read as generated rather than designed. The rail is the sequence.
 *  - Pacing is uneven on purpose. The gap into module two is tighter than the
 *    gap into module three, because two answers the question one just raised
 *    and three changes the subject to what happens next.
 *
 * Reverting is one line in app/(marketing)/page.tsx -- swap DebriefStage back
 * for PerceptionGap + DebriefReplay + VectorSection. Those three files are
 * still present and unmodified; nothing here imports them, and this file
 * duplicates the small amount of markup it needs from them rather than
 * refactoring them into shared parts, so that deleting this file and the rail
 * leaves the old path exactly as it was.
 *
 * Not applied to Overview, Next Flight or Progress pending review of this one.
 */
const MODULES = [
  { id: "debrief-perception", label: "What happened" },
  { id: "debrief-replay", label: "What was said" },
  { id: "debrief-vector", label: "What matters next" },
] as const;

const KNOWS = [
  "Which corrections you relax, and when",
  "The weak area two instructors have now flagged",
  "Where your read of a flight differs from your CFI's",
  "What you have already proven you can do",
] as const;

export function DebriefStage() {
  return (
    <section id="debrief" className="bg-[#f4f5f6] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1180px]">
        {/* The stage announces itself once, for everyone. Below lg this is the
            only stage identity there is, so it carries the framing copy the
            rail carries on desktop. */}
        <Reveal className="lg:hidden">
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.22em] text-brand">Debrief</p>
          <h2 className="font-display mt-3 text-balance text-4xl font-bold leading-[1.06] text-[#101727]">
            What the lesson actually contained.
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-[#414B57]">
            Three things you find out after you land, in the order you find them out.
          </p>
        </Reveal>

        <div className="lg:grid lg:grid-cols-[210px_1fr] lg:gap-x-20 xl:grid-cols-[230px_1fr]">
          <DebriefStageRail modules={MODULES} />

          {/* No forced heights, no snapping, no transforms tied to scroll
              position. The modules are ordinary blocks in ordinary flow; the
              only thing that moves independently is the rail, and it moves by
              being sticky rather than by being animated. */}
          <div className="mt-14 flex flex-col lg:mt-0">
            <Module
              id={MODULES[0].id}
              eyebrow="Two views of the same flight"
              headline="See where you and your instructor landed."
              body="You record how the flight felt to you before you see their debrief. When the two readings differ, that gap is usually the most useful thing in the lesson."
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Reveal delay={100}>
                  <View
                    label="You felt"
                    quote="Crosswind landings were going pretty well."
                    accent="border-t-[#2c6c93]"
                    src="/images/marketing/cockpit-approach.webp"
                    alt="A student pilot's view over the panel on final approach"
                  />
                </Reveal>
                <Reveal delay={180}>
                  <View
                    label="Your instructor saw"
                    quote="Centerline control improved, but correction still needs more consistency through touchdown."
                    accent="border-t-brand"
                    src="/images/marketing/preflight-cfi-student.webp"
                    alt="A flight instructor and student going over the flight together beside the aircraft"
                  />
                </Reveal>
              </div>

              <Reveal delay={260} className="mt-5">
                <div className="grid gap-7 rounded-2xl bg-[#142033] px-7 py-7 sm:px-9 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Takeaway</p>
                    <p className="font-display mt-2.5 text-balance text-xl font-bold leading-snug text-white sm:text-2xl">
                      You&rsquo;re making progress, but consistency is still the thing to work on before the next
                      flight.
                    </p>
                  </div>

                  <dl className="flex flex-col gap-4 border-t border-white/10 pt-6 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8c97a2]">From</dt>
                      <dd className="mt-1 text-pretty text-[15px] font-semibold text-white">
                        Crosswind Landings &middot; Aug 29 with Jake
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8c97a2]">
                        Carries into
                      </dt>
                      <dd className="mt-1 flex items-start gap-2.5 text-pretty text-[15px] text-[#dfe4ec]">
                        <PlaneTakeoff className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                        Hold the correction through touchdown
                      </dd>
                    </div>
                  </dl>
                </div>
              </Reveal>
            </Module>

            {/* Tighter than the gap below, because this answers the question
                module one just raised. */}
            <Module
              id={MODULES[1].id}
              className="mt-20 sm:mt-24"
              eyebrow="Debrief replay"
              headline="Then hear it again in their own words."
              body="AfterFlight captures what happened in the lesson and what your instructor wants you working on, then turns it into a short recap you can replay on the drive home."
            >
              {/* The demo supplies its own white card, which is the raised
                  ground this module is meant to sit on -- so it is not wrapped
                  in a second one. Its default mt-20 would double the spacing
                  the module head already set. */}
              <DebriefRecapDemo showHeading={false} className="!mt-0" />
              <AudioPrivacyNote />
            </Module>

            <Module
              id={MODULES[2].id}
              className="mt-24 sm:mt-32"
              eyebrow="Meet Vector"
              headline={
                <>
                  Your AI flight trainer <span className="text-brand">between flights.</span>
                </>
              }
              body="Not a chatbot you have to brief first. Vector already knows how you fly — what your instructor flagged, what keeps coming back, what you've already proven — so the time between lessons goes at the thing actually holding you up."
            >
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-14">
                <Reveal delay={100}>
                  <VectorDemo />
                </Reveal>

                <Reveal delay={200}>
                  <p className="font-display text-balance text-2xl font-bold leading-tight text-[#101727]">
                    Vector knows how you fly.
                  </p>
                  <p className="text-pretty mt-3 text-lg leading-relaxed text-[#414B57]">
                    Not generic questions about airplanes in general &mdash; the specific things your own flying keeps
                    doing, and the ones your instructor has stopped having to mention.
                  </p>
                  <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-[#4E5A67]">What it knows</p>
                  <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-1">
                    {KNOWS.map((k) => (
                      <li key={k} className="flex items-start gap-3 text-pretty text-base text-[#101727]">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                        {k}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 rounded-lg border-l-[3px] border-brand bg-white px-6 py-5">
                    <p className="text-pretty text-lg font-semibold leading-relaxed text-[#101727]">
                      That&rsquo;s the difference between studying and training &mdash; you stop spending lessons
                      relearning what you already covered.
                    </p>
                  </div>
                  <p className="mt-5 text-pretty text-sm leading-relaxed text-[#4E5A67]">
                    Vector starts with your actual training record, and reaches for the FAA Airplane Flying Handbook,
                    the ACS and your POH when the answer needs a source.
                  </p>
                </Reveal>
              </div>
            </Module>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * A module head, left-aligned and numbered.
 *
 * Not SectionHead: that centers on a max-w-2xl measure, which is correct for a
 * standalone section and wrong here. Centered heads inside a stage recreate
 * exactly the "three separate sections" reading this is trying to replace, and
 * the rail already occupies the left, so a centered head would also sit off
 * the column's own axis.
 */
function Module({
  id,
  eyebrow,
  headline,
  body,
  children,
  className,
}: {
  id: string;
  eyebrow: string;
  headline: ReactNode;
  body: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article id={id} className={`scroll-mt-28 ${className ?? ""}`}>
      <Reveal>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand">{eyebrow}</span>
          <span className="h-px flex-1 bg-black/[0.09]" aria-hidden />
        </div>
        <h3 className="font-display mt-4 max-w-[19ch] text-balance text-3xl font-bold leading-[1.08] text-[#101727] sm:text-[2.25rem]">
          {headline}
        </h3>
        <p className="mt-4 max-w-[62ch] text-pretty text-lg leading-relaxed text-[#414B57]">{body}</p>
      </Reveal>
      <div className="mt-10">{children}</div>
    </article>
  );
}

/** Duplicated from perception-gap.tsx so that file stays untouched and revertible. */
function View({
  label,
  quote,
  accent,
  src,
  alt,
}: {
  label: string;
  quote: string;
  accent: string;
  src: string;
  alt: string;
}) {
  return (
    <figure className="flex h-full flex-col overflow-hidden rounded-2xl bg-white">
      <div className="relative aspect-[16/10] w-full">
        <Image src={src} alt={alt} fill className="object-cover" sizes="(min-width: 640px) 380px, 100vw" />
      </div>
      <div className={`flex flex-1 flex-col border-t-[3px] px-7 py-7 ${accent}`}>
        <figcaption className="text-xs font-bold uppercase tracking-[0.14em] text-[#4E5A67]">{label}</figcaption>
        <blockquote className="mt-3 text-pretty text-lg italic leading-relaxed text-[#101727]">
          &ldquo;{quote}&rdquo;
        </blockquote>
      </div>
    </figure>
  );
}
