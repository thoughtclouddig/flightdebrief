import { z } from "zod";

/** Structured output for a single AI-drafted resource article -- see article-prompt.ts. */
export const generatedArticleSchema = z.object({
  title: z.string().default(""),
  dek: z.string().default(""),
  body: z.string().default(""),
});

export type GeneratedArticle = z.infer<typeof generatedArticleSchema>;
