import type { ArticleBody as ArticleBodyShape } from "@/lib/content/article-body";
import { hasStructuredBody } from "@/lib/content/article-body";

/**
 * Renders an article's body.
 *
 * Two shapes, on purpose. Structured articles (lib/content/article-body.ts)
 * get a real document: a lead answer, key facts, H2 sections, and an FAQ.
 * Articles written before that existed have only flat prose, and there's no
 * honest way to invent structure for them after the fact -- those fall back
 * to paragraphs rather than being guessed at.
 *
 * The measure is the main typographic decision here. The reading column was
 * max-w-3xl at 17px, which runs to roughly 90 characters a line -- far past
 * the 65-75 where the eye reliably finds the next line. Body text is capped
 * in `ch` so it stays correct if the type scale changes.
 */

const MEASURE = "max-w-[66ch]";

function Paragraphs({ text, className }: { text: string; className?: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={`flex flex-col gap-6 ${className ?? ""}`}>
      {paragraphs.map((p, i) => (
        // lang is what makes hyphens-auto work at all -- the browser needs a
        // language to pick hyphenation rules. Without it the rag stays as
        // ragged as it was.
        <p
          key={i}
          lang="en"
          className={`hyphens-auto text-pretty text-[17.5px] leading-[1.8] text-[#3f474f] ${MEASURE}`}
        >
          {p}
        </p>
      ))}
    </div>
  );
}

export function ArticleBody({
  body,
  plainText,
  hero,
}: {
  body: ArticleBodyShape | null;
  plainText: string;
  /** Rendered after the lead answer -- see the note at its usage below. */
  hero?: React.ReactNode;
}) {
  if (!hasStructuredBody(body)) {
    // Nothing to lead with, so the image goes back to the top where it's the
    // only thing giving the page a shape.
    return (
      <div className="flex flex-col gap-8">
        {hero}
        <Paragraphs text={plainText} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* The lead answer. Set large and in full-strength ink because it's the
          passage an answer engine lifts, and the one a reader who bounces
          after ten seconds actually reads.
          No panel or tint: a boxed answer looks deliberate on one article and
          like a template on a hundred. A single brand rule and the size carry
          it. */}
      {/* Stepped down from 23px and narrowed. Large type only reads as
          emphasis when it's short; a 90-word answer set at 23px across the
          full measure is just a second headline the reader has to get past. */}
      <p className="max-w-[54ch] border-t-[3px] border-brand pt-6 text-pretty text-[19.5px] font-medium leading-[1.6] text-[#101727]">
        {body.answer}
      </p>

      {/* Hero sits after the answer, not above it. Putting it first pushes the
          answer below the fold on a phone, which is the one thing this layout
          exists to prevent. */}
      {hero}

      {body.keyFacts.length > 0 ? (
        <div className={`rounded-lg border border-[#e4e7ea] bg-[#fafafb] px-6 py-5 ${MEASURE}`}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#4E5A67]">Key facts</p>
          <ul className="mt-3 flex flex-col gap-2">
            {body.keyFacts.map((fact, i) => (
              <li key={i} className="flex gap-3 text-pretty text-[17px] leading-relaxed text-[#3f474f]">
                <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-brand" />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {body.sections.map((section, i) => (
        // id so each section is directly linkable -- a section that can be
        // cited at its own anchor is worth more than one buried mid-page.
        <section key={i} id={slugify(section.heading)} className="scroll-mt-24">
          <h2 className={`font-display text-balance text-2xl font-bold text-[#101727] ${MEASURE}`}>
            {section.heading}
          </h2>
          <Paragraphs text={section.body} className="mt-4" />

          {/* A real <ol>: a procedure should be marked up as one, both for a
              reader skimming and for an answer engine lifting it as steps. */}
          {section.steps && section.steps.length > 0 ? (
            <ol className={`mt-5 flex flex-col gap-3 ${MEASURE}`}>
              {section.steps.map((step, j) => (
                <li key={j} className="flex gap-3.5 text-pretty text-[17px] leading-[1.7] text-[#3f474f]">
                  <span
                    aria-hidden
                    className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#f4f5f6] text-[13px] font-bold text-[#101727]"
                  >
                    {j + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          ) : null}

          {/* No fill. Everything orange on this page is structure or something
              to click, and the page already spends its one panel treatment on
              key facts and the CTA -- a third use would make the device
              decoration rather than meaning. */}
          {section.tip ? (
            <aside className={`mt-6 border-l-[3px] border-brand py-0.5 pl-5 ${MEASURE}`}>
              <p className="text-[11px] font-bold uppercase tracking-[0.11em] text-[#4E5A67]">Instructor tip</p>
              <p className="mt-1.5 text-pretty text-[16.5px] leading-[1.7] text-[#3f474f]">{section.tip}</p>
            </aside>
          ) : null}

          {/* A line from this section's own body, set large. It repeats text
              deliberately: the job is to give the eye somewhere to land while
              scanning, not to add information. aria-hidden because a screen
              reader has already read it in the paragraph above. */}
          {section.pullQuote ? (
            <p
              aria-hidden
              className="font-display mt-7 max-w-[34ch] border-l-[3px] border-brand pl-6 text-balance text-[22px] font-bold leading-[1.35] text-[#101727]"
            >
              {section.pullQuote}
            </p>
          ) : null}

          {section.comparison ? (
            <div className={`mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 ${MEASURE}`}>
              {[
                { label: section.comparison.leftLabel, text: section.comparison.left },
                { label: section.comparison.rightLabel, text: section.comparison.right },
              ].map((side, j) => (
                <div key={j} className="rounded-lg border border-[#e4e7ea] px-5 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#4E5A67]">{side.label}</p>
                  <p className="mt-2 text-pretty text-[15.5px] leading-[1.65] text-[#3f474f]">{side.text}</p>
                </div>
              ))}
            </div>
          ) : null}

          {/* Checklist, not steps: these are things to confirm, in any order.
              Rendering them as numbered steps would claim a sequence that
              isn't there. */}
          {section.checklist && section.checklist.length > 0 ? (
            <ul className={`mt-5 flex flex-col gap-2.5 ${MEASURE}`}>
              {section.checklist.map((item, j) => (
                <li key={j} className="flex gap-3 text-pretty text-[17px] leading-[1.7] text-[#3f474f]">
                  <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    fill="none"
                    className="mt-1 size-[18px] shrink-0 text-brand"
                  >
                    <rect x="1.5" y="1.5" width="17" height="17" rx="4" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5.5 10.2l3 3 6-6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {section.image ? (
            <figure className="mt-7">
              {/* eslint-disable-next-line @next/next/no-img-element -- served from /api/media */}
              <img src={section.image.url} alt="" loading="lazy" className="aspect-[16/9] w-full rounded-xl object-cover" />
              {section.image.caption ? (
                <figcaption className="mt-2.5 text-[13.5px] leading-relaxed text-[#414B57]">
                  {section.image.caption}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          {/* H3, so a long section can break up without diluting the
              one-question-per-H2 pattern search keys off. */}
          {section.subsections?.map((sub, j) => (
            <div key={j} className="mt-7">
              <h3 className={`font-display text-[19px] font-bold text-[#101727] ${MEASURE}`}>{sub.heading}</h3>
              <Paragraphs text={sub.body} className="mt-3" />
            </div>
          ))}
        </section>
      ))}

      {body.faq.length > 0 ? (
        <section id="faq" className="scroll-mt-24 border-t border-[#e4e7ea] pt-10">
          <h2 className={`font-display text-2xl font-bold text-[#101727] ${MEASURE}`}>Common questions</h2>
          <dl className="mt-6 flex flex-col gap-6">
            {body.faq.map((item, i) => (
              <div key={i}>
                <dt className={`text-[17px] font-semibold text-[#101727] ${MEASURE}`}>{item.question}</dt>
                <dd className={`mt-2 text-pretty text-[17px] leading-[1.75] text-[#3f474f] ${MEASURE}`}>
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
}

/** Stable anchor from a heading -- used for per-section deep links. */
export function slugify(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}
