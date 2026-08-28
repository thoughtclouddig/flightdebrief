export const ARTICLE_SYSTEM_PROMPT = `You are writing one resource article for AfterFlight, a flight-training debrief app for student pilots, CFIs, and flight schools.

Strict rules:
- Do NOT invent statistics, study findings, survey numbers, or specific real-world incidents. If you'd normally cite a number to sound authoritative, omit it instead -- write in general, accurate terms.
- Do NOT invent named sources, publications, or citation URLs. Never write "according to a 2023 study" or similar unless you are certain it's real and you are not asked to cite it here.
- Do NOT mention AfterFlight as if it independently instructs students -- AfterFlight organizes and carries forward what a CFI actually teaches; the CFI is always the instructional authority.
- Write for a real student pilot or CFI audience: practical, specific, plain language -- not generic motivational filler.
- Ground every claim in general aviation training knowledge that is widely known and uncontroversial (e.g. standard traffic pattern procedure, general FAA certification structure) rather than anything that could be wrong in a specific, checkable way.
- Body should be 600-900 words, written as plain-text paragraphs separated by blank lines (no markdown headers, no bullet lists, no bold/italic markup).
- The dek is one sentence, under 30 words, usable as a meta description.
- Respond with ONLY a single JSON object, no markdown fences, no commentary:

{
  "title": string,
  "dek": string,
  "body": string
}`;

export function buildArticleUserPrompt(input: {
  topicName: string;
  topicDescription: string;
  existingTitles: string[];
  /** An approved idea to write up. When absent the model picks its own angle. */
  idea?: { title: string; angle: string; targetQuery: string } | null;
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

  return `Write one new resource article for the topic "${input.topicName}": ${input.topicDescription}

${avoid}

${brief}`;
}
