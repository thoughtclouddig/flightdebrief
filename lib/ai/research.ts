import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { extractJson } from "./extract-json";
import type { ResourceTopic, Source, SourceType } from "@/lib/types";

/**
 * The research pass. Runs before anything is written.
 *
 * This is the fix for the root cause of the invented statistic, rather than
 * another rule telling the writer not to invent one. Asked for authoritative
 * copy with no source material, a model produces authoritative-sounding copy
 * -- "activates 80% of the same brain regions" is what that looks like. The
 * fact-checker downstream can only smell such a claim; it can't check it,
 * because there is nothing to check it against.
 *
 * So the researcher goes and reads first, using the API's server-side web
 * search, and hands the writer a set of findings each attached to a real URL
 * it actually retrieved. The writer is then told to work only from those. The
 * fact-checker gets the same list and can verify claim against source.
 *
 * It also unblocks citations. articles.sources has been hardcoded empty since
 * the pipeline was built, because an invented citation is worse than none.
 * These URLs came back from a search, so they can be published.
 */

// web_search_20260209 (dynamic filtering) needs Opus 5/4.8/4.7/4.6, Sonnet 5,
// or Sonnet 4.6. Sonnet 5 is the cheapest model that supports it.
const MODEL = "claude-sonnet-5";

const SOURCE_TYPES = [
  "faa_requirement",
  "faa_guidance",
  "ntsb",
  "nasa",
  "peer_reviewed_research",
  "industry_standard",
  "expert_opinion",
] as const satisfies readonly SourceType[];

export interface ResearchFinding {
  /** One checkable statement, in plain language. */
  claim: string;
  /** Where it came from. */
  source: Source;
  /** The passage that supports it, quoted, so a human can audit the link. */
  support: string;
}

export interface ResearchBrief {
  findings: ResearchFinding[];
  /** What the researcher looked for and could not substantiate. */
  gaps: string[];
}

const researchSchema = z.object({
  findings: z
    .array(
      z.object({
        claim: z.string().default(""),
        label: z.string().default(""),
        url: z.string().default(""),
        // A plain string, mapped afterwards. As a z.enum, one unrecognised
        // value ("faa_handbook", "research") threw the whole parse and
        // discarded every finding alongside it -- eight verified sources lost
        // to one label. The label is the least important field here; the URL
        // and the quote are the point.
        sourceType: z.string().default(""),
        support: z.string().default(""),
      }),
    )
    .default([]),
  gaps: z.array(z.string()).default([]),
});

const RESEARCH_SYSTEM = `You are the researcher for AfterFlight's flight-training articles: a career aviation educator doing the reading before someone else writes. Think of yourself as the person a chief instructor asks to check something before it goes in a syllabus. You do not write the article.

WHAT YOU KNOW

You know where flight-training facts actually live, and you go to the primary document rather than someone's summary of it:

- 14 CFR (the FARs) for requirements: Part 61 for certification, currency, and experience; Part 91 for operating rules; Part 141 for approved-course structure. Cite the section, and read it -- eligibility, aeronautical experience, and currency are three different things, and articles routinely conflate them.
- The ACS and PTS for what a checkride actually tests, including the current tolerances. The ACS is revised; check which edition you are reading.
- FAA handbooks for technique and theory: the Airplane Flying Handbook (FAA-H-8083-3) for maneuvers, the Pilot's Handbook of Aeronautical Knowledge (FAA-H-8083-25) for systems and aerodynamics, the Aviation Instructor's Handbook (FAA-H-8083-9) for learning theory, instruction, and assessment -- that last one is the right source for most claims about how students learn, and it is chronically uncited.
- Advisory Circulars for FAA guidance, and the AIM for procedures and phraseology. Neither is regulatory; say so when it matters.
- NTSB reports and dockets for accident causation. NASA ASRS for incident reports and human-factors patterns, with its self-reporting bias stated.
- Peer-reviewed work for anything about skill acquisition, retention, or workload. Aviation psychology and human-factors journals, not a blog's summary of a study.

WHAT YOU DON'T TRUST

You can tell a source from an echo. Flight-training content online is dominated by schools and gear sites rewriting each other, and the same unsourced number circulates for years.

- A number with no reachable original study is a rumour with a decimal point, however many sites repeat it.
- Forum posts and Reddit are not sources. They are occasionally useful for finding what instructors argue about, which is a good article angle, but never for a factual claim.
- A flight school's blog is marketing. So is an aviation-insurance company's "safety" page.
- "The FAA requires..." with no citation is usually wrong, or is quoting a superseded revision. Go find the section.
- Regulations change and handbooks are revised. A 2011 blog post citing a since-amended rule is worse than no source.

You also know what a CFI reads as credible. An instructor who spots one wrong tolerance or one misquoted reg stops believing the whole article, and they will spot it.

Search the web for material on the assigned question, working from the hierarchy above.

WHAT COUNTS AS A FINDING

A finding is one checkable statement plus the page you found it on. Every finding needs a URL you actually retrieved in this session. Never write down a URL you did not open, and never reconstruct one you believe exists.

Quote the supporting passage verbatim in "support". If you cannot quote it, you have not verified it, and it is not a finding.

WHAT TO LEAVE OUT

- Anything you could not find a source for. That belongs in "gaps".
- Anything you know from training but did not confirm in a search result. Also a gap.
- Marketing copy, content-farm articles, and SEO pages restating other pages. They are not sources.
- Statistics whose original study you cannot reach. A number quoted third-hand is a rumour with a decimal point.

GAPS ARE THE VALUABLE PART

The gaps list is what stops the writer inventing. Be specific: "no FAA guidance found on how long currency skills persist between lessons" is useful. "Not much information" is not.

Return ONLY this JSON, no fences, no commentary:

{
  "findings": [
    {
      "claim": "the checkable statement, in plain language",
      "label": "short human-readable name of the source",
      "url": "the exact URL you retrieved",
      "sourceType": one of: ${SOURCE_TYPES.join(", ")},
      "support": "the passage from that page that supports the claim, quoted"
    }
  ],
  "gaps": ["what you looked for and could not substantiate"]
}

Ten to fifteen searches is plenty. Six well-sourced findings beat twenty thin ones.`;

export async function researchArticle(input: {
  topic: ResourceTopic;
  title: string;
  angle: string;
  targetQuery: string;
}): Promise<ResearchBrief> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set -- cannot research an article");

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: RESEARCH_SYSTEM,
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 15 }],
    messages: [
      {
        role: "user",
        content: `Research this article before it is written.

Topic: ${input.topic.name} -- ${input.topic.description}
Working title: ${input.title}
Angle: ${input.angle}
The reader's question: ${input.targetQuery}

Find what can be substantiated about it, and say plainly what cannot.`,
      },
    ],
  });

  // The server runs its own search loop and pauses when it hits the iteration
  // cap. Resuming is a re-send with the assistant turn appended and no new
  // user message -- the API sees the trailing server_tool_use and continues.
  let current = response;
  const history: Anthropic.MessageParam[] = [];
  let resumes = 0;
  while (current.stop_reason === "pause_turn" && resumes < 4) {
    history.push({ role: "assistant", content: current.content });
    current = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: RESEARCH_SYSTEM,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 15 }],
      messages: [
        { role: "user", content: `Research this article: ${input.title}` },
        ...history,
      ],
    });
    resumes += 1;
  }

  const textBlock = [...current.content].reverse().find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Research returned no text content");
  }

  let parsed;
  try {
    parsed = researchSchema.parse(JSON.parse(extractJson(textBlock.text)));
  } catch (err) {
    // Loudly, with the text: a research pass that silently returns nothing
    // produces an unsourced article that looks exactly like a sourced one.
    console.error("[research] could not parse the researcher's reply:", err);
    console.error("[research] reply began:", textBlock.text.slice(0, 400));
    throw new Error("The researcher's reply could not be parsed.");
  }

  const findings = parsed.findings
    // A finding without a real http(s) URL is exactly the thing this pass
    // exists to prevent, so it's dropped rather than trusted.
    .filter((f) => f.claim.trim() && f.support.trim() && /^https?:\/\//i.test(f.url.trim()))
    .map((f) => ({
      claim: f.claim.trim(),
      support: f.support.trim(),
      source: {
        label: f.label.trim() || f.url.trim(),
        url: f.url.trim(),
        sourceType: toSourceType(f.sourceType),
      },
    }));

  console.log(
    `[research] ${findings.length} findings, ${parsed.gaps.length} gaps (${parsed.findings.length - findings.length} dropped for a missing URL or quote)`,
  );

  return { findings, gaps: parsed.gaps.map((g) => g.trim()).filter(Boolean) };
}

/**
 * Maps whatever label came back onto the stored vocabulary. Unrecognised
 * values become expert_opinion -- the weakest classification, so a
 * mislabelled source is under-claimed rather than over-claimed.
 */
function toSourceType(value: string): SourceType {
  const normalised = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const match = SOURCE_TYPES.find((t) => t === normalised);
  return match ?? "expert_opinion";
}

/** The findings as prompt material for the writer and the fact checker. */
export function formatBrief(brief: ResearchBrief): string {
  if (brief.findings.length === 0 && brief.gaps.length === 0) return "";

  const findings = brief.findings
    .map((f, i) => `${i + 1}. ${f.claim}\n   Source: ${f.source.label} (${f.source.url})\n   Supporting passage: "${f.support}"`)
    .join("\n\n");

  const gaps = brief.gaps.length
    ? `\n\nCOULD NOT BE SUBSTANTIATED. Do not state any of these as fact, and do not work around them with vaguer wording that implies the same claim:\n${brief.gaps.map((g) => `- ${g}`).join("\n")}`
    : "";

  return `RESEARCH FINDINGS

These were gathered and verified before writing. Every factual claim in the article must trace to one of them. If a sentence would be stronger with a fact that is not here, write it without the fact.

${findings}${gaps}`;
}

/** De-duplicated sources for the article record, so citations are real. */
export function sourcesFrom(brief: ResearchBrief): Source[] {
  const byUrl = new Map<string, Source>();
  for (const finding of brief.findings) byUrl.set(finding.source.url, finding.source);
  return [...byUrl.values()];
}
