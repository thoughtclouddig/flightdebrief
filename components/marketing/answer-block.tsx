import type { ReactNode } from "react";

/**
 * Question + direct-answer pattern for AEO (answer-engine optimization): a
 * standalone paragraph that makes sense if extracted on its own by ChatGPT,
 * Perplexity, Google AI Overviews, etc. Presentational only -- deliberately
 * not marked up as FAQPage schema, so it can't read as an attempt to game
 * rich results.
 */
export function AnswerBlock({
  question,
  answer,
  children,
}: {
  question: string;
  answer: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-[#101727]">{question}</h2>
      <p className="mt-3 text-pretty text-lg leading-relaxed text-[#101727]">{answer}</p>
      {children ? (
        <div className="mt-3 flex flex-col gap-3 text-pretty leading-relaxed text-[#414B57]">{children}</div>
      ) : null}
    </div>
  );
}
