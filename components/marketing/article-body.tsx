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

const MEASURE = "max-w-[68ch]";

function Paragraphs({ text, className }: { text: string; className?: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={`flex flex-col gap-5 ${className ?? ""}`}>
      {paragraphs.map((p, i) => (
        <p key={i} className={`text-pretty text-[17px] leading-[1.75] text-[#3f474f] ${MEASURE}`}>
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
      <p
        className={`border-t-[3px] border-brand pt-6 text-pretty text-[23px] font-medium leading-[1.5] text-[#101727] ${MEASURE}`}
      >
        {body.answer}
      </p>

      {/* Hero sits after the answer, not above it. Putting it first pushes the
          answer below the fold on a phone, which is the one thing this layout
          exists to prevent. */}
      {hero}

      {body.keyFacts.length > 0 ? (
        <div className={`rounded-lg border border-[#e4e7ea] bg-[#fafafb] px-6 py-5 ${MEASURE}`}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#68717D]">Key facts</p>
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
