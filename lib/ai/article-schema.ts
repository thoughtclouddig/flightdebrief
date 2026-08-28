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
  title: z.string().default(""),
  dek: z.string().default(""),
  answer: z.string().default(""),
  keyFacts: z.array(z.string()).default([]),
  sections: z
    .array(
      z.object({
        heading: z.string().default(""),
        body: z.string().default(""),
        // Optional enrichments. Defaulted rather than required so a model
        // that returns none still produces a valid article -- most sections
        // should have none.
        steps: z.array(z.string()).default([]),
        tip: z.string().nullable().default(null),
        subsections: z
          .array(z.object({ heading: z.string().default(""), body: z.string().default("") }))
          .default([]),
        pullQuote: z.string().nullable().default(null),
        comparison: z
          .object({
            leftLabel: z.string().default(""),
            left: z.string().default(""),
            rightLabel: z.string().default(""),
            right: z.string().default(""),
          })
          .nullable()
          .default(null),
        checklist: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  faq: z
    .array(
      z.object({
        question: z.string().default(""),
        answer: z.string().default(""),
      }),
    )
    .default([]),
});

export type GeneratedArticle = z.infer<typeof generatedArticleSchema>;
