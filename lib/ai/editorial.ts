import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { extractJson } from "./extract-json";
import { ARTICLE_VOICE } from "./article-voice";
import type { ArticleBody } from "@/lib/content/article-body";

/**
 * The passes that run after the writer.
 *
 * One model writing once and stopping is how an invented statistic ships: the
 * writer is optimising for a persuasive article, and a claim like "activates
 * 80% of the same brain regions" makes the article better by that measure.
 * Nothing in a single pass is trying to make it *true*.
 *
 * So checking is a separate job with a separate instruction, run against text
 * it did not write and has no stake in. Each pass returns both the revised
 * body and a list of what it changed, because a pipeline that silently
 * rewrites is one nobody can audit -- the notes are what make a human able to
 * trust, or distrust, the result.
 *
 * Order matters: facts first, then prose. Fixing the writing of a sentence
 * that shouldn't exist is wasted work, and the fact pass deletes sentences.
 */

const MODEL = "claude-sonnet-4-5";

/** No pass should be able to stall the whole job indefinitely. */
const REQUEST_TIMEOUT_MS = 120_000;

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set -- cannot run the editorial pipeline");
  return new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 });
}

/** One thing a pass changed, in language a person reviewing the draft can act on. */
export interface EditorialNote {
  pass: "fact-check" | "copy-edit" | "design";
  /** The text as written, quoted, so a reviewer can find it. */
  before: string;
  /** What was wrong with it. */
  reason: string;
}

export interface EditorialResult {
  body: ArticleBody;
  notes: EditorialNote[];
}

const bodySchema = z.object({
  answer: z.string().default("").catch(""),
  keyFacts: z.array(z.string()).default([]).catch([]),
  sections: z
    .array(
      z.object({
        heading: z.string().default("").catch(""),
        body: z.string().default("").catch(""),
        steps: z.array(z.string()).default([]).catch([]),
        tip: z.string().nullable().default(null).catch(null),
        subsections: z.array(z.object({ heading: z.string().default("").catch(""), body: z.string().default("").catch("") })).default([]).catch([]),
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
  faq: z.array(z.object({ question: z.string().default("").catch(""), answer: z.string().default("").catch("") })).default([]).catch([]),
});

const passSchema = z.object({
  article: bodySchema,
  changes: z.array(z.object({ before: z.string().default("").catch(""), reason: z.string().default("").catch("") })).default([]).catch([]),
});

async function runPass(
  pass: EditorialNote["pass"],
  system: string,
  body: ArticleBody,
  /** Appended to the user turn -- the fact checker needs the sources. */
  context = "",
): Promise<EditorialResult> {
  console.log(`[editorial] ${pass} started`);
  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 5000,
    system,
    messages: [
      {
        role: "user",
        content: `Here is the article as JSON. Return the corrected article and the list of changes.\n\n${JSON.stringify(body, null, 2)}${context ? `\n\n${context}` : ""}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error(`${pass}: no text content in response`);

  let parsed;
  try {
    parsed = passSchema.parse(JSON.parse(extractJson(textBlock.text)));
  } catch (err) {
    // Named, and non-fatal. Losing a whole draft because the copy editor
    // returned a stray quotation mark is a bad trade: the input article is
    // already reviewed, and a skipped pass is recorded as a note.
    console.error(`[editorial] ${pass}: could not parse the reply:`, err);
    console.error(`[editorial] ${pass} reply began:`, textBlock.text.slice(0, 300));
    return {
      body,
      notes: [{ pass, before: "", reason: `The ${pass} pass returned something unreadable and was skipped.` }],
    };
  }

  // A pass that returns an empty or gutted article is a failed pass, not an
  // edit. Keeping the input is the safe direction: the draft is reviewed by a
  // human either way, and losing the article to a bad response is worse than
  // an unedited one.
  const revised = parsed.article;
  if (!revised.answer.trim() || revised.sections.length === 0) return { body, notes: [] };

  console.log(`[editorial] ${pass} made ${parsed.changes.length} changes`);

  return {
    body: {
      answer: revised.answer.trim(),
      keyFacts: revised.keyFacts.map((f) => f.trim()).filter(Boolean),
      sections: revised.sections
        .filter((s) => s.heading.trim() && s.body.trim())
        .map((s) => ({
          heading: s.heading.trim(),
          body: s.body.trim(),
          steps: s.steps.map((step) => step.trim()).filter(Boolean),
          tip: s.tip?.trim() || null,
          pullQuote: s.pullQuote?.trim() || null,
          comparison:
            s.comparison && s.comparison.left.trim() && s.comparison.right.trim() ? s.comparison : null,
          checklist: s.checklist.map((c) => c.trim()).filter(Boolean),
          subsections: s.subsections
            .map((sub) => ({ heading: sub.heading.trim(), body: sub.body.trim() }))
            .filter((sub) => sub.heading && sub.body),
        })),
      faq: revised.faq.filter((f) => f.question.trim() && f.answer.trim()),
    },
    notes: parsed.changes
      .filter((c) => c.before.trim() || c.reason.trim())
      .map((c) => ({ pass, before: c.before.trim(), reason: c.reason.trim() })),
  };
}

const FACT_CHECK_SYSTEM = `You are the fact checker for AfterFlight's flight-training articles. You did not write this article and you have no stake in it.

Your only job is removing claims that cannot be verified. You are not improving the writing. Leave the prose alone except where a claim has to change.

REMOVE OR REWRITE, every time:

- Any statistic or percentage. "Activates 80% of the same brain regions", "cuts training time by a third", "most students". If a number is not something the writer could have looked up in a regulation or a manual, it goes.
- Any claim not traceable to the research findings, when findings are supplied below. The findings are the article's entire evidence base: a factual claim that does not appear in them was not verified by anyone, however plausible it sounds. Check each claim against them rather than judging by feel.
- Any appeal to research. "Studies show", "neuroimaging studies", "research suggests", "what researchers call", "data indicates". Delete the appeal. If the underlying point stands on its own in plain language, keep the point and drop the citation.
- Any unnamed authority. "Experts agree", "most instructors believe", "it is widely known".
- Any claim about outcomes nobody measured. "Students who do this pass at higher rates", "produces measurable improvement".
- Any regulation, ACS tolerance, currency requirement, or checkride minimum stated as a specific value, unless it is so standard that being wrong is implausible. Prefer describing the requirement in general terms.
- Any named study, author, publication, date, or incident.

HOW TO REWRITE

Do not just delete the sentence and leave a hole. Rewrite it so the mechanism survives without the false precision.

"Mental rehearsal activates 80% of the same brain regions used in flight" becomes "Rehearsing a procedure in your head uses some of the same sequencing your brain uses in the aircraft."

Keep the article's structure exactly: the same sections, the same headings, the same order. You are editing text inside them.

Return ONLY this JSON, no fences, no commentary:

{
  "article": { the full corrected article, same shape as the input },
  "changes": [{ "before": "the exact claim you removed, quoted", "reason": "why it could not stand" }]
}

If nothing needed changing, return the article unchanged and an empty changes array. Do not invent changes to look thorough.`;

const COPY_EDIT_SYSTEM = `You are the copy editor for AfterFlight's flight-training articles. The facts have already been checked by someone else. Do not add, remove, or alter any factual claim -- if you think something is wrong, leave it and note it.

${ARTICLE_VOICE}

YOUR SPECIFIC JOB

1. Enforce every rule above. The banned constructions are the point of this pass.
2. Break up density. No paragraph runs past 45 words or 3 sentences. A section body must be 2 to 4 paragraphs separated by a blank line, never one block.
3. Delete em dashes and en dashes ("—", "–") wherever they appear. Replace with a comma, colon, full stop, or a rewrite.
4. Cut the lead answer to 55 words or fewer if it is longer, without losing what it answers.
5. Tighten. If a sentence says nothing the one before it did not, remove it.

Keep the structure: same sections, same headings, same order, same steps and tips.

Return ONLY this JSON, no fences, no commentary:

{
  "article": { the full edited article, same shape as the input },
  "changes": [{ "before": "the phrase or sentence you changed, quoted", "reason": "which rule it broke" }]
}

Report only substantive changes. Do not list every comma.`;


const DESIGN_SYSTEM = `You are the designer for AfterFlight's flight-training articles. The facts are checked and the prose is edited. You do not rewrite copy. You decide what breaks it up.

THE PROBLEM YOU ARE SOLVING

A reader scanning a long article sees an undifferentiated gray column and leaves. Every block currently has the same visual weight. Your job is to give the eye somewhere to land, roughly every screen.

YOUR VOCABULARY, and when each earns its place:

- pullQuote: ONE sentence copied VERBATIM from that same section's body, set large. It must appear word for word in the body -- you are not writing a new line, you are marking an existing one. Pick the sentence a reader should leave with. At most one per section, and no more than one for every two sections in the article.
- comparison: two sides of a distinction the section actually turns on. Only when both sides are genuinely stated in the copy. Never invent the other side to fill the shape.
- checklist: things to confirm, in any order. Distinct from steps, which are sequential. Never convert a real sequence into a checklist or vice versa.
- steps: an ordered procedure, 2 or more. Leave existing ones alone unless they aren't really sequential.
- tip: at most one in the whole article.

HOW MUCH

Aim for a device on roughly every other section, and use at least three different kinds across the article. A page of headings and paragraphs with one tip in it is the failure mode -- a reader scrolling it sees an undifferentiated gray column and leaves, which is the whole problem you were brought in to solve.

Being timid is the more likely mistake here, not being excessive. If a section has a genuine procedure in it, pull the steps out. If it turns on a distinction, build the comparison. If it has a sentence a reader should leave with, mark it as a pull quote. Look for the device the copy already contains rather than waiting for an obvious one.

RULES

- A section under 120 words needs nothing. Leave it alone.
- Never put two devices in the same section.
- Never use the same device in two consecutive sections.
- Remove a device that doesn't meet these rules. Taking one away is as valid as adding one.
- Change no wording anywhere. A pull quote must already exist as a sentence in that section's body.

Return ONLY this JSON, no fences, no commentary:

{
  "article": { the full article with devices set, same shape as the input },
  "changes": [{ "before": "which section, and what you added or removed", "reason": "why it earns its place" }]
}`;

export async function design(body: ArticleBody): Promise<EditorialResult> {
  return runPass("design", DESIGN_SYSTEM, body);
}

export async function factCheck(body: ArticleBody, research = ""): Promise<EditorialResult> {
  return runPass("fact-check", FACT_CHECK_SYSTEM, body, research);
}

export async function copyEdit(body: ArticleBody): Promise<EditorialResult> {
  return runPass("copy-edit", COPY_EDIT_SYSTEM, body);
}

/**
 * Writer output in, reviewed article out.
 *
 * Failures are swallowed on purpose. A draft that skipped a review pass is
 * still a draft a human reviews before publishing, and losing a finished
 * article because the second of three API calls timed out would be the worse
 * outcome. The notes say which passes ran, so a skipped one is visible rather
 * than silent.
 */
export async function reviewArticle(
  body: ArticleBody,
  research = "",
  report: (stage: string) => void = () => {},
): Promise<EditorialResult> {
  const notes: EditorialNote[] = [];
  let current = body;

  try {
    report("Fact-checking");
    const checked = await factCheck(current, research);
    current = checked.body;
    notes.push(...checked.notes);
  } catch (err) {
    console.error("[editorial] fact check failed:", err);
    notes.push({ pass: "fact-check", before: "", reason: "Fact check did not run. Verify claims by hand." });
  }

  try {
    report("Copy-editing");
    const edited = await copyEdit(current);
    current = edited.body;
    notes.push(...edited.notes);
  } catch (err) {
    console.error("[editorial] copy edit failed:", err);
    notes.push({ pass: "copy-edit", before: "", reason: "Copy edit did not run. Read for voice by hand." });
  }

  try {
    report("Designing");
    const designed = await design(current);
    current = designed.body;
    notes.push(...designed.notes);
  } catch (err) {
    console.error("[editorial] design pass failed:", err);
    notes.push({ pass: "design", before: "", reason: "Design pass did not run. The article renders as plain prose." });
  }

  return { body: current, notes };
}
