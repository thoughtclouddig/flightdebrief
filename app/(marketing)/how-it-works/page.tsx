import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CtaLink } from "@/components/marketing/cta-link";
import { Reveal } from "@/components/marketing/reveal";
import { appOrigin } from "@/lib/email";

export const metadata: Metadata = {
  title: "How AfterFlight Works — For School Owners",
  description:
    "What gets captured, who sees what, what happens when an instructor leaves, and what AfterFlight deliberately does not do.",
  alternates: appOrigin() ? { canonical: `${appOrigin()}/how-it-works` } : undefined,
};

/**
 * Written for the person who has to answer for the decision -- owner or
 * chief instructor -- and reads the way that person actually evaluates
 * software: what does it cost my instructors, what does it expose me to,
 * and what is it not.
 *
 * Deliberately does not describe scheduling, dispatch, billing or Part 141
 * recordkeeping, because AfterFlight does not do those and a page that
 * gestures at them invites a comparison against products that do.
 *
 * This was built on LegalPage/LegalSection -- the same template as /privacy
 * and /terms -- which is why it read like a Word document. That template is
 * correct for a document someone is obliged to publish and wrong for the page
 * a school owner reads before deciding. The words are almost all unchanged;
 * what changed is that the page now has a hierarchy.
 *
 * The three sentences that were buried in body copy are the page: ninety
 * seconds, nothing recorded is kept, and no instructor scorecards. Each is a
 * different kind of objection -- cost to my staff, exposure to me, and what
 * this does to my instructors -- so they lead, and everything below is the
 * detail behind them.
 */
const CLAIMS = [
  {
    figure: "90 seconds",
    label: "What it costs a CFI",
    body: "Tap record, give the debrief, tap stop. No typing, no grading grid, no approval step.",
  },
  {
    figure: "Nothing kept",
    label: "The audio",
    body: "Transcribed as it happens and discarded. There is no archive to produce, export, or subpoena.",
  },
  {
    figure: "No scorecards",
    label: "On your instructors",
    body: "No debrief-quality scores, no CFI rankings, no dashboard for grading the people who teach.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <>
      <section className="bg-white px-6 pb-20 pt-32 sm:pb-24 sm:pt-36">
        <div className="mx-auto max-w-[1100px]">
          <Reveal className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">For school owners</p>
            <h1
              className="font-display mt-4 text-balance text-4xl font-bold leading-[1.05] text-[#101727] sm:text-5xl"
              style={{ textTransform: "none" }}
            >
              What AfterFlight does, and{" "}
              <span className="text-brand">what it deliberately does not.</span>
            </h1>
            <p className="mt-6 max-w-[62ch] text-pretty text-lg leading-relaxed text-[#414B57]">
              Your instructors already debrief. AfterFlight listens to that conversation, turns it into a structured
              training record, and makes sure what mattered in one lesson reaches the next one, including when the
              next lesson is with a different instructor.
            </p>
          </Reveal>

          {/* The disclaimer belongs high, not in a footnote. A school owner is
              sorting this against products they already pay for, and leaving
              the comparison unstated invites the wrong one. */}
          <Reveal delay={120} className="mt-10 max-w-3xl border-l-[3px] border-black/[0.13] pl-5">
            <p className="text-pretty text-base leading-relaxed text-[#414B57]">
              It is <span className="font-semibold text-[#101727]">not</span> a scheduling system, a dispatch system,
              a billing system, or a Part 141 recordkeeping platform. It sits alongside whatever you already use for
              those.
            </p>
          </Reveal>
        </div>
      </section>

      {/* The three objections, answered before the detail that supports them. */}
      <section className="bg-[#142033] px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-[1100px] gap-10 sm:grid-cols-3 sm:gap-8">
          {CLAIMS.map((c, i) => (
            <Reveal key={c.figure} delay={i * 90}>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9da7b8]">{c.label}</p>
              <p className="font-display mt-2 text-balance text-3xl font-extrabold leading-none text-white">
                {c.figure}
              </p>
              <p className="mt-3 text-pretty text-[15px] leading-relaxed text-[#dfe4ec]">{c.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-[#f4f5f6] px-6 py-20 sm:py-28">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-16 sm:gap-20">
          <Block eyebrow="What it costs your instructors" headline="Ninety seconds, and no typing.">
            <p>
              Tap record, give the debrief, tap stop. No grading grid, no AI output to review and approve, no
              signature step. This matters more than any feature: software that asks instructors for unpaid minutes
              after a lesson gets quietly abandoned.
            </p>
          </Block>

          <Block eyebrow="What gets captured" headline="One conversation, turned into a record.">
            <p>
              What was worked on, what went well, what needs work, the instructor&rsquo;s guidance quoted and
              attributed, action items, a focus for the next flight, and relevant study references. The student also
              gets a short audio recap of their own debrief.
            </p>
            <p>
              Where your syllabus is structured, students and instructors can each assess the same tasks
              independently. When they see the same flight differently, AfterFlight shows both views side by side,
              as the most useful thing in the debrief to talk about.
            </p>
          </Block>

          <Block eyebrow="Who sees what" headline="Scoped to one school, never shared.">
            <p>
              Students see their own records. Instructors see the students they train. Administrators see their
              school. Records are scoped to one organization and are never shared between schools.
            </p>
          </Block>

          {/* The scenario that sells this to a school, so it gets the weight. */}
          <Block
            eyebrow="When an instructor leaves"
            headline="The handoff that usually happens in a hallway, written down."
          >
            <p>
              Most schools handle this as a conversation between the departing CFI and the next one, if they
              overlap at all. AfterFlight produces that handoff as a page instead: where the student is, what the
              last instructor wanted continued, and what is still unresolved.
            </p>
            <p>
              It also notices when a weakness has persisted across a change of instructor, which no single instructor
              can see because each of them only has their own lessons. That is reported as a property of the skill,
              since a problem outliving two teachers is usually about the skill rather than the teaching.
            </p>
          </Block>

          <Block eyebrow="Recording, and what we keep" headline="The audio is never stored.">
            <p>
              Audio is transcribed as it happens and discarded. There is no archive to produce, export, or subpoena.
              Consent is captured before recording starts and stamped with the version of the text the person
              actually saw. Transcripts age out on a schedule you control, while the structured training record is
              kept so a student keeps their history.
            </p>
            <p>
              The specifics, in writing, are at{" "}
              <a href="/data-handling" className="font-medium text-[#101727] underline underline-offset-2">
                recording, retention &amp; deletion
              </a>
              .
            </p>
          </Block>

          <Block eyebrow="What we deliberately do not build" headline="No instructor scorecards. Ever.">
            <p>
              No debrief-quality scores, no CFI rankings, and no dashboard for evaluating instructors from debrief
              content. We are asked for this and we decline, for a practical reason as much as a principled one: an
              instructor who believes a tool is grading them stops speaking freely into it, and an unguarded debrief
              is the only thing here worth capturing.
            </p>
          </Block>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-balance text-3xl font-bold leading-tight text-[#101727] sm:text-4xl">
            School Core is free.
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-[#414B57]">
            No card, no per-seat pricing. Try it with a few instructors before you commit.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CtaLink href="/signup/school">Create a school account</CtaLink>
            <CtaLink href="/schools" variant="secondary">
              AfterFlight for schools
            </CtaLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}

/**
 * A section head in the same shape the homepage stage bands use: brand eyebrow
 * on a rule, then the claim as a headline, then the prose. The old page put a
 * plain bold h2 directly above a paragraph at the same measure, which is the
 * shape of a document rather than a page.
 */
function Block({ eyebrow, headline, children }: { eyebrow: string; headline: string; children: ReactNode }) {
  return (
    <Reveal className="grid gap-x-12 gap-y-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div>
        <div className="flex items-center gap-4">
          <span className="shrink-0 whitespace-nowrap text-xs font-bold uppercase tracking-[0.16em] text-brand">
            {eyebrow}
          </span>
          <span className="h-px min-w-0 flex-1 bg-black/[0.09] lg:hidden" aria-hidden />
        </div>
        <h2 className="font-display mt-3 text-balance text-2xl font-bold leading-snug text-[#101727]">{headline}</h2>
      </div>
      <div className="flex flex-col gap-4 text-pretty text-lg leading-relaxed text-[#414B57]">{children}</div>
    </Reveal>
  );
}
