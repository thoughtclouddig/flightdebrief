import type { ReactNode } from "react";
import { ArrowRight, BookOpen, MessagesSquare, ShieldCheck, Target } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const NEXT_FLIGHT_STATS = [
  { label: "Practice", value: "Steep turns" },
  { label: "Focus", value: "Altitude control" },
  { label: "Goal", value: "±100 ft" },
];

/** A single thread node: dot on the connecting line + a block of content. Reused for every stage so the "these are one lesson" relationship reads as one continuous UI, not a row of unrelated widgets. */
function ThreadBlock({
  icon: Icon,
  eyebrow,
  children,
  last,
}: {
  icon: typeof MessagesSquare;
  eyebrow: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-5 pl-1">
      <div className="flex flex-col items-center">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10">
          <Icon className="size-4 text-brand" strokeWidth={2} />
        </span>
        {!last ? <span className="mt-2 w-px flex-1 bg-black/[0.08]" /> : null}
      </div>
      <div className={last ? "pb-1" : "pb-10"}>
        <p className="text-balance text-xs font-bold uppercase tracking-[0.14em] text-[#8c97a2]">{eyebrow}</p>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}

export function FeedbackToPlan() {
  return (
    <section className="bg-white px-6 py-28 sm:py-36">
      <div className="mx-auto max-w-[1320px]">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-balance text-4xl font-bold text-[#101727] sm:text-5xl">
            A better debrief gives you a better next flight.
          </h2>
          <p className="mt-4 text-balance text-lg text-[#68717D]">
            AfterFlight connects what happened, what your instructor said, what the ACS requires, and what to
            study&mdash;then turns it into a clear objective for your next flight.
          </p>
        </Reveal>

        <Reveal delay={150} className="mx-auto mt-16 max-w-2xl">
          {/* iPad-style device frame: aluminum bezel + camera dot around the card, so the thread reads as a real on-device screen. */}
          <div className="rounded-[40px] bg-gradient-to-b from-[#e4e5e8] to-[#d3d5d9] p-3 shadow-[0_1px_2px_rgba(16,23,39,0.04),0_24px_60px_-20px_rgba(16,23,39,0.16)] ring-1 ring-black/[0.08] sm:p-4">
            <div className="flex justify-center py-2">
              <span className="size-1.5 rounded-full bg-black/25" />
            </div>

            <div className="rounded-[26px] bg-white p-8 ring-1 ring-black/[0.05] sm:p-10">
              <p className="text-balance mb-6 text-xs font-bold uppercase tracking-[0.14em] text-brand">
                Today&rsquo;s Flight &middot; Steep Turns
              </p>

              <ThreadBlock icon={Target} eyebrow="Area to improve">
                <p className="text-balance font-display text-lg font-bold text-[#101727]">Altitude control</p>
                <p className="text-pretty mt-1 text-sm text-[#68717D]">Altitude increased 180 ft during the second half of the turn.</p>
              </ThreadBlock>

              <ThreadBlock icon={MessagesSquare} eyebrow="Your instructor said">
                <p className="text-pretty text-[15px] italic leading-relaxed text-[#101727]">
                  &ldquo;Get the trim set before entry and use the horizon as your primary outside reference.&rdquo;
                </p>
              </ThreadBlock>

              <ThreadBlock icon={ShieldCheck} eyebrow="ACS connection">
                <p className="text-balance text-xs font-bold uppercase tracking-wide text-[#8c97a2]">FAA Airman Certification Standards</p>
                <p className="text-balance font-display mt-1 text-base font-bold text-[#101727]">Steep Turns &middot; PA.V.A.S3</p>
                <p className="text-balance mt-0.5 text-sm text-[#68717D]">Maintain altitude &plusmn;100 feet</p>
                <a href="#" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
                  View ACS standard <ArrowRight className="size-3.5" />
                </a>
              </ThreadBlock>

              <ThreadBlock icon={BookOpen} eyebrow="Study this">
                <p className="text-balance text-xs font-bold uppercase tracking-wide text-[#8c97a2]">FAA Airplane Flying Handbook</p>
                <p className="text-balance font-display mt-1 text-base font-bold text-[#101727]">
                  Performance Maneuvers &middot; Steep Turns
                </p>
                <a href="#" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
                  Open reference <ArrowRight className="size-3.5" />
                </a>
              </ThreadBlock>

              <ThreadBlock icon={Target} eyebrow="Next flight" last>
                <div className="grid grid-cols-3 gap-4">
                  {NEXT_FLIGHT_STATS.map((stat) => (
                    <div key={stat.label}>
                      <p className="text-xs font-medium text-[#8c97a2]">{stat.label}</p>
                      <p className="font-display mt-0.5 whitespace-nowrap text-sm font-bold text-[#101727]">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </ThreadBlock>
            </div>
          </div>
        </Reveal>

        <Reveal delay={250} className="mx-auto mt-16 max-w-lg text-center">
          <div className="mx-auto h-px w-10 bg-brand/40" aria-hidden="true" />
          <p className="font-display mt-6 text-balance text-xl italic leading-snug text-[#101727] sm:text-2xl">
            <span className="text-brand" aria-hidden="true">
              &ldquo;
            </span>
            The postflight debrief is how you make sure you&rsquo;re learning something new from every hour at
            the controls.
            <span className="text-brand" aria-hidden="true">
              &rdquo;
            </span>
          </p>
          <p className="text-balance mt-3 text-sm font-semibold text-[#4b545d]">
            Ian Wilder <span className="font-normal text-[#4b545d]/70">&mdash; AOPA Flight Training</span>
          </p>
          <p className="text-balance mt-1 text-xs text-[#4b545d]/60">Source: AOPA Flight Training</p>
        </Reveal>
      </div>
    </section>
  );
}
