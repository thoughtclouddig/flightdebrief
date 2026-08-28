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
  line: string;
  label: string;
  href: string;
}

const BY_TOPIC: Record<string, Cta> = {
  "cfi-resources": {
    line: "AfterFlight captures the debrief you just ran and turns it into next lesson's plan, so nothing you said has to be remembered twice.",
    label: "See it for instructors",
    href: "/instructors",
  },
  "flight-schools": {
    line: "AfterFlight gives a school one place to see what every student is working on, without asking instructors to file more paperwork.",
    label: "See it for schools",
    href: "/schools",
  },
  "student-pilot": {
    line: "AfterFlight records your debrief and carries what your instructor said into your next lesson.",
    label: "Start free",
    href: "/signup/student",
  },
  "checkride-prep": {
    line: "AfterFlight tracks which areas keep coming up across your debriefs, so you know what's actually still weak.",
    label: "Start free",
    href: "/signup/student",
  },
  "safety-proficiency": {
    line: "AfterFlight works the same way when you're flying on your own -- talk through the flight, and it keeps the thread between them.",
    label: "Start free",
    href: "/signup/student",
  },
};

const DEFAULT_CTA: Cta = {
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
    <aside className="mt-14 border-t border-[#e4e7ea] pt-8">
      <p className="max-w-[62ch] text-pretty text-[17px] leading-relaxed text-[#3f474f]">{cta.line}</p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-bright hover:text-[#101727]"
      >
        {cta.label}
      </Link>
    </aside>
  );
}
