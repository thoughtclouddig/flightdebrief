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

const MODEL = "claude-sonnet-5";

/**
 * The basic search tool, deliberately, not web_search_20260209.
 *
 * The _20260209 variant filters results dynamically by running code under the
 * hood, so it draws on a code-execution quota as well as search. In practice
 * that quota ran out: the first run returned eight sourced findings and every
 * run afterwards failed with "Server tool use limit exceeded during code
 * execution", producing articles with no sources at all.
 *
 * The basic tool has no such dependency. It returns unfiltered results, which
 * costs some precision -- but a researcher that works is worth more than one
 * that filters well twice a month.
 */
const SEARCH_TOOL = { type: "web_search_20250305", name: "web_search", max_uses: 6 } as const;

/**
 * A stalled upstream call used to spin forever: the job never completed and
 * never failed, so the desk showed "researching" indefinitely with nothing to
 * read. A pass that gives up loudly beats one that hangs quietly.
 *
 * 90s is deliberate. The first version of this prompt ran to 4,290 characters
 * and timed out at 120s every time, while a short one finished the same work
 * in about 30 -- the model was spending its budget weighing an elaborate
 * source hierarchy instead of searching. A research pass that needs more than
 * a minute and a half is too slow for a daily schedule anyway, so the timeout
 * is set where it will catch that regression rather than accommodate it.
 */
const REQUEST_TIMEOUT_MS = 90_000;

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

const RESEARCH_SYSTEM = `You are an aviation educator gathering sources before someone else writes an article. You do not write it.

Search the web and return findings. Work fast: search, verify, report.

GO TO THE PRIMARY DOCUMENT
14 CFR for requirements (Part 61 certification and currency, Part 91 operating rules). The ACS for what a checkride tests. FAA handbooks for technique and theory -- the Aviation Instructor's Handbook (FAA-H-8083-9) is the right source for claims about how students learn. Advisory Circulars and the AIM for guidance and procedures, neither of which is regulatory. NTSB and NASA ASRS for accidents and incidents. Peer-reviewed journals for skill acquisition and retention.

NOT SOURCES
Flight-school blogs, gear retailers, and content farms rewriting each other. Forums. Any statistic whose original study you cannot reach -- a number repeated across twenty sites is still a rumour. "The FAA requires..." with no citation, which is usually a superseded revision.

EVERY FINDING NEEDS
A URL you actually retrieved in this session, and the supporting passage quoted verbatim. If you cannot quote it, you have not verified it.

GAPS
List what you looked for and could not substantiate. Be specific: "no FAA guidance found on skill decay between lessons" is useful, "limited information" is not. This is what stops the writer inventing.

Six well-sourced findings beat twenty thin ones. Return ONLY this JSON, no fences, no commentary:

{"findings":[{"claim":"...","label":"source name","url":"https://...","sourceType":"one of: ${SOURCE_TYPES.join(" | ")}","support":"quoted passage"}],"gaps":["..."]}`;

export async function researchArticle(input: {
  topic: ResourceTopic;
  title: string;
  angle: string;
  targetQuery: string;
}): Promise<ResearchBrief> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set -- cannot research an article");

  // maxRetries: 0 deliberately. With a retry, the timeout is the ceiling for
  // one attempt but not for the call -- a stalled search sat on "Researching"
  // for twice the stated limit, which is exactly the opaque wait the timeout
  // was added to prevent. One attempt, then a clear failure.
  const client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 });
  console.log(`[research] searching: ${input.title}`);
  const startedAt = Date.now();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: RESEARCH_SYSTEM,
    // 15 was optimistic: each search pulls page content through the model, so
    // a wide sweep is both slow and expensive. Six was enough to produce
    // eight sourced findings in testing.
    tools: [SEARCH_TOOL],
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
  let searches = response.usage?.server_tool_use?.web_search_requests ?? 0;
  let resumes = 0;
  while (current.stop_reason === "pause_turn" && resumes < 2) {
    console.log(`[research] resuming a paused search loop (${resumes + 1})`);
    history.push({ role: "assistant", content: current.content });
    current = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: RESEARCH_SYSTEM,
      tools: [SEARCH_TOOL],
      messages: [
        { role: "user", content: `Research this article: ${input.title}` },
        ...history,
      ],
    });
    searches += current.usage?.server_tool_use?.web_search_requests ?? 0;
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

  // Zero searches means the tool never ran -- a quota, an outage, a rejected
  // tool definition. Returning "no findings" for that is the silent failure
  // that produced unsourced articles for a day: it looks identical to a
  // subject nothing has been written about.
  if (searches === 0) {
    throw new Error("Web search did not run -- no sources could be gathered.");
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
    `[research] done in ${Math.round((Date.now() - startedAt) / 1000)}s: ${findings.length} findings, ${parsed.gaps.length} gaps (${parsed.findings.length - findings.length} dropped for a missing URL or quote)`,
  );

  return { findings, gaps: parsed.gaps.map((g) => g.trim()).filter(Boolean) };
}

/**
 * Maps whatever label came back onto the stored vocabulary.
 *
 * The researcher describes its sources in its own words however precisely the
 * contract lists the options -- real replies have included "peer-reviewed
 * journal", "14 CFR / FAA regulatory standard (ACS)", and "other (journalism
 * reporting on in-progress academic research)". Those are good descriptions;
 * they just aren't the enum. Matching on the words rather than demanding the
 * exact token keeps a Journal of Applied Psychology meta-analysis labelled as
 * research instead of demoting it to one person's opinion.
 *
 * Order matters: the first match wins, so the more specific patterns come
 * first. Anything unrecognised falls to expert_opinion, the weakest
 * classification -- a mislabelled source is under-claimed, never over-claimed.
 */
function toSourceType(value: string): SourceType {
  // "non-regulatory" contains "regulat", which matched the requirement rule
  // and promoted an industry safety publication to a binding FAA standard --
  // the exact direction of error this function must never make. The negation
  // is stripped before anything is matched.
  const text = value.trim().toLowerCase().replace(/\bnon.?regulatory\b/g, "");

  const exact = SOURCE_TYPES.find((t) => t === text.replace(/[\s-]+/g, "_"));
  if (exact) return exact;

  // Journalism first: a news piece about a study says "research" and
  // "academic" and is not itself research. The researcher labels these
  // honestly ("journalism reporting on in-progress academic research"), and
  // taking it at its word beats matching the topic words inside it.
  if (/journalis|magazine|news|blog|reporting on/.test(text)) return "expert_opinion";

  if (/ntsb|accident report/.test(text)) return "ntsb";
  if (/nasa|asrs/.test(text)) return "nasa";
  if (/peer.?review|journal|meta.?analys|study|academic/.test(text)) return "peer_reviewed_research";
  // Requirement before guidance: an ACS or a CFR part is binding, an AC or
  // the AIM is not, and calling the second the first is the error that
  // matters to a checkride.
  if (/cfr|far\b|acs\b|pts\b|regulat|requirement/.test(text)) return "faa_requirement";
  if (/faa|advisory circular|\bac\b|aim\b|handbook|guidance/.test(text)) return "faa_guidance";
  if (/industry|standard|association|aopa|nbaa/.test(text)) return "industry_standard";

  return "expert_opinion";
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

/** Exported for tests only -- the mapping is worth pinning, the call is not. */
export const __testing = { toSourceType };
