import { detectTopics, suggestStudyReferences } from "@/lib/topics";
import type { AnalyzeDebriefInput, StructuredDebriefResult } from "./schema";

/**
 * Deterministic local stand-in for Claude, used whenever ANTHROPIC_API_KEY is
 * not configured. It applies simple lexical heuristics to the transcript --
 * good enough to demo the full pipeline end-to-end without ever fabricating
 * anything the student (or instructor) didn't actually say.
 */
export function analyzeMock(input: AnalyzeDebriefInput): StructuredDebriefResult {
  const sentences = splitSentences(input.transcript);
  const instructorName = input.flightMeta.instructorName ?? "Instructor";

  const whatWeDid = detectTopics(input.transcript);
  // A sentence with both cues ("radio calls were better, but I missed...") reads as
  // a critique first -- keep it in needsWork only, not duplicated into wentWell.
  const wentWell = sentences.filter((s) => matches(s, POSITIVE_CUES) && !matches(s, NEGATIVE_CUES));
  const needsWork = sentences.filter((s) => matches(s, NEGATIVE_CUES));
  const instructorGuidance = extractInstructorGuidance(sentences, instructorName);
  const actionItems = buildActionItems(needsWork, whatWeDid, input.previousActionItems);
  const nextLessonFocus = buildNextLessonFocus(whatWeDid, needsWork);
  const studyReferences = suggestStudyReferences([...needsWork, ...actionItems].join(" "));

  return {
    whatWeDid,
    wentWell: dedupe(wentWell).slice(0, 6),
    needsWork: dedupe(needsWork).slice(0, 6),
    instructorGuidance,
    actionItems: dedupe(actionItems).slice(0, 6),
    nextLessonFocus: dedupe(nextLessonFocus).slice(0, 4),
    studyReferences,
  };
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function matches(sentence: string, cues: string[]) {
  const lower = sentence.toLowerCase();
  return cues.some((cue) => lower.includes(cue));
}

function dedupe(items: string[]) {
  return Array.from(new Set(items.map((s) => s.trim()))).filter(Boolean);
}

const POSITIVE_CUES = [
  "better",
  "good",
  "improved",
  "confidence",
  "confident",
  "correctly",
  "smooth",
  "solid",
  "well",
  "nailed",
  "much better",
];

const NEGATIVE_CUES = [
  "rough",
  "too much",
  "too fast",
  "too slow",
  "floated",
  "missed",
  "need to",
  "needs work",
  "work on",
  "struggled",
  "late",
  "behind",
  "squirrelly",
];

function extractInstructorGuidance(sentences: string[], instructorName: string) {
  const namePattern = new RegExp(
    `\\b(${escapeRegExp(instructorName)}|instructor)\\b\\s+(said|told me|had me|wanted me to|said to)\\b`,
    "i",
  );
  const guidance: { instructorName: string; quote: string }[] = [];
  for (const sentence of sentences) {
    const match = sentence.match(namePattern);
    if (!match) continue;
    const quote = sentence.slice(match.index! + match[0].length).trim().replace(/^to\s+/i, "");
    if (quote) {
      guidance.push({ instructorName, quote: capitalize(quote) });
    }
  }
  return guidance.slice(0, 4);
}

function buildActionItems(needsWork: string[], topics: string[], previous: string[]) {
  const derived = needsWork.map(toActionItem);
  const carried = previous.filter((item) =>
    needsWork.some((n) => overlapsTopically(n, item)),
  );
  return [...carried, ...derived];
}

function toActionItem(sentence: string) {
  const lower = sentence.toLowerCase();
  if (lower.includes("speed")) return "Review target approach speeds";
  if (lower.includes("float")) return "Practice holding target airspeed on final";
  if (lower.includes("radio") || lower.includes("tower") || lower.includes("instruction"))
    return "Practice tower readback scenarios, including amended instructions";
  if (lower.includes("configur")) return "Practice configuring the aircraft earlier in the pattern";
  if (lower.includes("short field")) return "Review short-field landing checklist";
  if (lower.includes("crosswind") || lower.includes("squirrelly")) return "Practice crosswind correction technique on final";
  if (lower.includes("bounc")) return "Practice smooth control inputs through the landing flare";
  if (lower.includes("behind") || lower.includes("late")) return "Practice staying ahead of the aircraft during the approach";
  return `Work on: ${capitalize(sentence.replace(/^(i|we)\s+/i, "").replace(/,?\s*but\s+.*$/i, "").trim())}`;
}

function buildNextLessonFocus(topics: string[], needsWork: string[]) {
  const focus = new Set<string>();
  for (const t of topics) {
    if (t === "Landings") focus.add("Stabilized approaches");
    if (t === "Short-field landings") focus.add("Short-field landings");
    if (t === "Crosswind landings") focus.add("Crosswind landings");
    if (t === "Tower communications") focus.add("Radio communications");
    if (t === "Steep turns" || t === "Slow flight" || t === "Stalls") focus.add("Slow flight & maneuvers");
    if (t === "Emergency procedures") focus.add("Emergency procedures");
    if (t === "Navigation") focus.add("Cross-country navigation");
  }
  if (needsWork.some((n) => /speed|float/i.test(n))) focus.add("Stabilized approaches");
  if (focus.size === 0) focus.add("General pattern work");
  return Array.from(focus);
}

function overlapsTopically(a: string, b: string) {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const wordsB = b.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  return wordsB.some((w) => wordsA.has(w));
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
