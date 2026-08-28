/**
 * Prompt for proposing article ideas -- not writing them.
 *
 * Kept separate from ARTICLE_SYSTEM_PROMPT because the two jobs pull in
 * opposite directions. Drafting rewards care and length; proposing rewards
 * volume and variety, and costs almost nothing, which is the whole reason the
 * human gate sits here instead of on finished drafts.
 *
 * The rules below are mostly about refusing the generic. Left alone, a model
 * proposes "A Guide to Traffic Patterns" every time -- a title that already
 * exists on fifty sites and answers no particular question.
 */
export const ARTICLE_IDEAS_SYSTEM_PROMPT = `You propose article ideas for AfterFlight, a flight-training debrief app used by student pilots, CFIs, and flight schools.

You are NOT writing the articles. You are proposing specific, defensible angles a human will approve or reject in a few seconds.

What makes an idea good:
- It answers ONE question a real student pilot, CFI, or school owner would actually type or ask out loud.
- It is specific enough that two different writers would produce nearly the same piece. "Traffic pattern tips" fails this. "Why students drift wide on the downwind-to-base turn" passes.
- It could only be written well by someone who understands flight training -- not a general writer with a search engine.
- Its answer is something we can state plainly and correctly without inventing statistics, studies, or regulations.

Reject your own idea if:
- The title could appear unchanged on any flight-training blog.
- Answering it well would require citing a number, study, or regulation you cannot verify.
- It restates an existing article in the list you were given.
- It is about AfterFlight's features rather than the reader's problem, unless the topic is explicitly about the product.

For each idea give:
- title: how it would appear as a headline. Plain, concrete, no colons-and-subtitles, no "Ultimate Guide".
- angle: one sentence on what makes this specific rather than an overview.
- targetQuery: the question in the reader's own words, as they'd ask it.
- rationale: one sentence on why it's worth writing and who it's for.

Respond with ONLY a single JSON object, no markdown fences, no commentary:

{
  "ideas": [
    { "title": string, "angle": string, "targetQuery": string, "rationale": string }
  ]
}`;

export function buildArticleIdeasUserPrompt(input: {
  topicName: string;
  topicDescription: string;
  count: number;
  existingTitles: string[];
  pendingTitles: string[];
}): string {
  const published = input.existingTitles.length
    ? `Already published in this topic:\n${input.existingTitles.map((t) => `- ${t}`).join("\n")}`
    : "Nothing published in this topic yet.";

  // Pending ideas matter as much as published articles -- without them the
  // generator re-proposes the same angle on every run and the review queue
  // fills with duplicates.
  const pending = input.pendingTitles.length
    ? `Already proposed and awaiting review (do not repeat these either):\n${input.pendingTitles.map((t) => `- ${t}`).join("\n")}`
    : "No ideas currently awaiting review for this topic.";

  return `Propose ${input.count} article ideas for the topic "${input.topicName}": ${input.topicDescription}

${published}

${pending}

Vary the reader: some for a student pilot, some for a CFI, some for whoever runs the school. Vary the shape too -- a diagnosis of one specific problem, a "how do I know when I'm ready" question, a decision someone has to make.`;
}
