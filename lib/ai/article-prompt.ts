import { ARTICLE_VOICE } from "./article-voice";

/**
 * Drafting prompt for one resource article.
 *
 * Asks for a structured body (see lib/content/article-body.ts) rather than
 * prose, for the reason that shapes the whole content system: search ranks
 * sections and answer engines quote passages, so the unit of work is the
 * section, not the article. A wall of paragraphs gives neither anything to
 * hold on to.
 *
 * Voice and factual rules live in article-voice.ts so they can be edited
 * without touching the JSON contract, and so anything else writing in
 * AfterFlight's voice reads from one place.
 */
export const ARTICLE_SYSTEM_PROMPT = `You are writing one resource article for AfterFlight, a flight-training debrief app used by student pilots, CFIs, and flight schools.

${ARTICLE_VOICE}

STRUCTURE

Return the article as parts, not prose. Each part has a job:

- title: the headline. Plain and concrete. No colon-subtitle constructions, no "Ultimate Guide", no "Everything You Need to Know".
- dek: one sentence under 30 words, usable as a meta description. Says what the reader gets, not what the article "explores".
- answer: 40 to 55 words. Hard limit: never more than 55. It answers the title completely, immediately, with no preamble. This is the most important text on the page -- it is what a reader who leaves after ten seconds takes away, and what an answer engine quotes. Do not open with "it depends", do not restate the question, do not promise that the article will explain. Answer it.
- keyFacts: 3 to 5 short lines, each concrete and standalone. Specifics, not restatements of the answer.
- sections: 4 to 6 of them. Each has:
    heading: phrased as the question a reader would actually ask, in their words. "Why does my student balloon the flare?" not "Flare Technique Considerations".
    body: 100 to 200 words that answer that heading and nothing else, written as 2 to 4 SHORT PARAGRAPHS separated by a blank line (\n\n). Never one unbroken block. No paragraph runs past 45 words or 3 sentences. A reader scans before they read, and a 200-word slab gives them nothing to land on.
    steps: OPTIONAL. Only when the section describes a genuine procedure where the order matters, and only with 2 or more steps. A numbered list of unordered points is a paragraph wearing a costume. Most sections have none. Each step is one short imperative sentence.
    tip: OPTIONAL. At most one section in the whole article gets one, and many articles get none. It is a single sentence of practical instructor advice that the body does not already say. A tip restating the section is worse than no tip, because a reader who is burned once stops reading them.
    subsections: OPTIONAL. Only when a section genuinely covers two named sub-topics, each needing 60 to 120 words. Never use one to split a section in half arbitrarily. Each has a short heading (a phrase, not a question -- the question belongs to the H2 above it) and a body.
- faq: 3 to 5 further questions with 40 to 80 word answers. Genuine questions the article raised but did not fully cover -- not the section headings restated.

THE SELF-CONTAINMENT RULE

Every section and every FAQ answer must make complete sense when read alone, with no surrounding context. They will be extracted and quoted that way.

That means: no "as mentioned above", no "as we saw earlier", no "this" or "that" referring back to a previous section, no "the first point" or "finally". If a section depends on something said earlier, restate the necessary part briefly inside it.

Respond with ONLY a single JSON object, no markdown fences, no commentary:

{
  "title": string,
  "dek": string,
  "answer": string,
  "keyFacts": string[],
  "sections": [{ "heading": string, "body": string, "steps": string[], "tip": string | null, "subsections": [{ "heading": string, "body": string }] }],
  "faq": [{ "question": string, "answer": string }]
}`;

export function buildArticleUserPrompt(input: {
  topicName: string;
  topicDescription: string;
  existingTitles: string[];
  /** An approved idea to write up. When absent the model picks its own angle. */
  idea?: { title: string; angle: string; targetQuery: string } | null;
  /** Verified findings from the research pass -- see lib/ai/research.ts. */
  research?: string;
}): string {
  const avoid = input.existingTitles.length
    ? `Existing articles already published in this topic (write about something different, don't repeat these):\n${input.existingTitles.map((t) => `- ${t}`).join("\n")}`
    : "No articles published in this topic yet.";

  // A human approved this exact angle, so it isn't a suggestion -- drifting
  // off it would publish something nobody reviewed.
  const brief = input.idea
    ? `Write this specific approved article:

Working title: ${input.idea.title}
Angle: ${input.idea.angle}
The reader's question: ${input.idea.targetQuery}

Answer that question directly. You may improve the title's wording, but do not change the subject.`
    : "Pick a specific, useful angle within this topic -- not a generic overview.";

  // The research brief goes last so it's the most recent thing in context
  // when writing starts, and is framed as the source of record rather than
  // background reading.
  const research = input.research ? `\n\n${input.research}` : "";

  return `Write one new resource article for the topic "${input.topicName}": ${input.topicDescription}

${avoid}

${brief}${research}`;
}
