import { z } from "zod";

/**
 * Structured output for one AI-drafted article -- see article-prompt.ts.
 *
 * Every field defaults rather than being required, matching the convention in
 * lib/ai/schema.ts: a model that returns four of five fields should still
 * produce a usable draft a human can finish, not a hard failure that loses the
 * whole generation. generateArticleDraft enforces the parts that genuinely
 * can't be missing.
 */
export const generatedArticleSchema = z.object({
  title: z.string().default("").catch(""),
  dek: z.string().default("").catch(""),
  answer: z.string().default("").catch(""),
  keyFacts: z.array(z.string()).default([]).catch([]),
  sections: z
    .array(
      z.object({
        heading: z.string().default("").catch(""),
        body: z.string().default("").catch(""),
        // Optional enrichments. Defaulted rather than required so a model
        // that returns none still produces a valid article -- most sections
        // should have none.
        steps: z.array(z.string()).default([]).catch([]),
        tip: z.string().nullable().default(null).catch(null),
        subsections: z
          .array(z.object({ heading: z.string().default("").catch(""), body: z.string().default("").catch("") }))
          .default([]).catch([]),
        pullQuote: z.string().nullable().default(null).catch(null),
        comparison: z
          .object({
            leftLabel: z.string().default("").catch(""),
            left: z.string().default("").catch(""),
            rightLabel: z.string().default("").catch(""),
            right: z.string().default("").catch(""),
          })
          .nullable()
          .default(null).catch(null),
        checklist: z.array(z.string()).default([]).catch([]),
      }),
    )
    .default([]).catch([]),
  faq: z
    .array(
      z.object({
        question: z.string().default("").catch(""),
        answer: z.string().default("").catch(""),
      }),
    )
    .default([]).catch([]),
});

export type GeneratedArticle = z.infer<typeof generatedArticleSchema>;
