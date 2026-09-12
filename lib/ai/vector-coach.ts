import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { extractJson } from "./extract-json";

/**
 * Judges one free-text answer inside Vector's bounded training-session
 * interaction (/train/vector/[skill]), the same way lib/ai/radio-judge.ts
 * judges a radio readback: grounded ONLY in reviewed material supplied by
 * the caller, never in the model's own aviation knowledge.
 *
 * The model is given a single reviewed question, the concepts a correct
 * answer should touch on, and the ideal explanation -- all authored and
 * reviewed in lib/topics.ts's TOPIC_LIBRARY, never generated. It is not
 * asked what the correct answer is, only whether this student's answer
 * conveys the concepts already provided. That boundary is the whole safety
 * property: a model free to introduce its own "correct" aviation facts here
 * could teach a student something nobody reviewed.
 */

const MODEL = "claude-sonnet-5";
const REQUEST_TIMEOUT_MS = 20_000;

export interface VectorCoachInput {
  /** Human-readable label, e.g. "Crosswind landings" -- for the model's own context, not graded against. */
  skillLabel: string;
  question: string;
  expectedConcepts: string[];
  explanation: string;
  /** This student's own real instructor evidence for this skill, when any exists. Never another student's, never invented. */
  studentEvidence: string | null;
  answer: string;
}

export interface VectorCoachEvaluation {
  /** Copied verbatim from expectedConcepts -- only the ones the student's answer actually conveyed. */
  matchedConcepts: string[];
  /** One to three sentences, instructor voice. */
  feedback: string;
  /** One concise, practical sentence to carry into the next flight. */
  takeaway: string;
}

const evaluationSchema = z.object({
  matchedConcepts: z.array(z.string()).default([]),
  feedback: z.string().default(""),
  takeaway: z.string().default(""),
});

const SYSTEM = `You are a flight instructor giving one short piece of feedback on a student pilot's answer to a single training question.

You are given: the skill this is about, the question, the concepts a correct answer should include (reviewed in advance -- these are the ONLY concepts you may credit or reference), the ideal explanation, and -- if available -- a real note from this student's own instructor about this same skill.

HOW TO EVALUATE
- Compare the student's answer only against the provided expected concepts. Mark a concept matched when the student's answer conveys it in their own words -- do not require exact phrasing.
- Do not invent additional requirements, aircraft-specific limitations, regulations, airspeeds, or "correct" answers beyond what is provided.
- Do not draw on aviation knowledge outside the provided material to introduce new facts, numbers, or procedures.
- If the student's answer conflicts with a provided concept, say so plainly -- do not soften a wrong answer into a right one.
- If instructor evidence is provided, you may reference it in feedback ONLY as what that instructor actually said. Never invent or paraphrase it as a new observation, and never claim the student demonstrated something the evidence doesn't support. If no instructor evidence is provided, do not invent any -- speak only to the answer and the expected concepts.

FEEDBACK
One to three sentences, instructor's voice. Name what the answer got and what it missed, plainly.

TAKEAWAY
One concise, practical sentence to carry into the next flight, drawn only from the provided explanation/concepts -- never introduce anything new.

Return ONLY this JSON, no fences, no commentary:

{
  "matchedConcepts": ["copied exactly from the provided expectedConcepts list, only the ones actually conveyed"],
  "feedback": "1-3 sentences",
  "takeaway": "one sentence"
}`;

export async function evaluateVectorAnswer(input: VectorCoachInput): Promise<VectorCoachEvaluation | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !input.answer.trim()) return null;

  const client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 });

  const prompt = `SKILL: ${input.skillLabel}

QUESTION: ${input.question}

EXPECTED CONCEPTS (the only ones you may credit or reference):
${input.expectedConcepts.map((c) => `- ${c}`).join("\n")}

IDEAL EXPLANATION (grounding for your takeaway -- do not go beyond it):
${input.explanation}

${input.studentEvidence ? `THIS STUDENT'S OWN INSTRUCTOR EVIDENCE FOR THIS SKILL:\n"${input.studentEvidence}"\n` : "No instructor evidence is available for this skill yet -- do not invent any.\n"}
STUDENT'S ANSWER:
"${input.answer}"`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const parsed = evaluationSchema.safeParse(JSON.parse(extractJson(raw)));
  if (!parsed.success) return null;

  // Belt-and-suspenders: even if the model returns a concept it wasn't
  // given, strip it rather than trust free-text output to stay inside the
  // provided list -- matchedConcepts is rendered as if it were reviewed
  // content, so it must actually be a subset of what was reviewed.
  const allowed = new Set(input.expectedConcepts);
  return { ...parsed.data, matchedConcepts: parsed.data.matchedConcepts.filter((c) => allowed.has(c)) };
}
