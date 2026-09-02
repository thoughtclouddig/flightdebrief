import Link from "next/link";

/**
 * The single call to action on an article, placed after the FAQ.
 *
 * One, at the end, and never inside the prose. Two reasons beyond taste:
 * the article prompt forbids framing AfterFlight as if it instructs students,
 * and letting product copy into the body would undo that on every page; and
 * answer engines quote passages, so a section carrying a pitch is a section
 * they skip -- promotional prose costs the extractability the whole content
 * strategy is built on.
 *
 * Keyed to the topic because the reader differs by piece. Whoever finished an
 * article on flare technique is an instructor; whoever finished one on what a
 * certificate costs is not. A single "Start free" under both converts badly
 * and reads as bolted on.
 *
 * Copy is written as a continuation of what they just read rather than a
 * pivot into a pitch -- one sentence that follows from the article, one link.
 */

interface Cta {
  /** One short line above the sentence -- gives the block a reason to be a block. */
  heading: string;
  line: string;
  label: string;
  href: string;
}

const BY_TOPIC: Record<string, Cta> = {
  "cfi-resources": {
    heading: "Run the debrief. Keep the debrief.",
    line: "AfterFlight captures the debrief you just ran and turns it into next lesson's plan, so nothing you said has to be remembered twice.",
    label: "See it for instructors",
    href: "/instructors",
  },
  "flight-schools": {
    heading: "See what every student is working on",
    line: "AfterFlight gives a school one place to see what every student is working on, without asking instructors to file more paperwork.",
    label: "See it for schools",
    href: "/schools",
  },
  "student-pilot": {
    heading: "Don't lose it on the drive home",
    line: "AfterFlight records your debrief and carries what your instructor said into your next lesson.",
    label: "Start free",
    href: "/signup/student",
  },
  "checkride-prep": {
    heading: "Know what's actually still weak",
    line: "AfterFlight tracks which areas keep coming up across your debriefs, so you know what's actually still weak.",
    label: "Start free",
    href: "/signup/student",
  },
  "safety-proficiency": {
    heading: "Keep the thread between flights",
    line: "AfterFlight works the same way when you're flying on your own -- talk through the flight, and it keeps the thread between them.",
    label: "Start free",
    href: "/signup/student",
  },
};

const DEFAULT_CTA: Cta = {
  heading: "Every flight teaches you something",
  line: "AfterFlight turns the conversation after a flight into a plan for the next one.",
  label: "See how it works",
  href: "/what-is-afterflight",
};

export function ArticleCta({ topicSlug }: { topicSlug: string | null }) {
  const cta = (topicSlug && BY_TOPIC[topicSlug]) || DEFAULT_CTA;

  // Tagged so content-driven signups are measurable rather than assumed. If
  // these convert at near zero that's worth knowing before scaling to
  // hundreds of articles -- it would mean content is a distribution play, not
  // a demand one.
  const href = `${cta.href}?from=resources${topicSlug ? `&topic=${encodeURIComponent(topicSlug)}` : ""}`;

  return (
    // A panel rather than a rule and a button. It reuses the key-facts
    // treatment -- same surface, same border, same radius -- so the page ends
    // up with one panel idea used twice rather than a second visual language
    // introduced at the bottom.
    <aside className="mt-14 overflow-hidden rounded-lg border border-[#e4e7ea] bg-[#fafafb]">
      {/* The brand appears as a rule here rather than as a fill: everything
          orange on this page is either a mark of structure or something to
          click, and a tinted panel behind the text would break that. */}
      <div aria-hidden className="h-1 bg-brand" />
      <div className="px-7 py-7 sm:px-8 sm:py-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#4E5A67]">AfterFlight</p>
        <p className="font-display mt-2 text-balance text-[26px] font-bold leading-[1.15] tracking-normal text-[#101727]">
          {cta.heading}
        </p>
        <p className="mt-3 max-w-[58ch] text-pretty text-[17px] leading-relaxed text-[#3f474f]">{cta.line}</p>
        <Link
          href={href}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-brand-bright hover:text-[#101727]"
        >
          {cta.label}
        </Link>
      </div>
    </aside>
  );
}
