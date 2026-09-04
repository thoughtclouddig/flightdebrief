import { NextResponse } from "next/server";
import { askVector, evaluateChairFly } from "@/lib/ai/vector";
import { KNOWLEDGE_CHECK } from "@/lib/prototype-fixtures/vector-data";
import { CHAIR_FLY } from "@/lib/prototype/chair-fly";
import { isProduction } from "@/lib/env";

/**
 * The prototype's single endpoint. Three intents rather than three routes,
 * because the whole surface is one conversation with different entry points
 * and splitting it would imply an architecture the prototype hasn't earned.
 *
 * Deliberately unauthenticated and read-only: it touches no database, reads
 * only the seeded module, and writes nothing.
 *
 * Not, however, free: the "ask" intent calls a real Anthropic API on every
 * request. Platform Hardening P0-5 blocks it in production -- unauthenticated
 * + real API cost + not in proxy.ts's matcher at all was an open spend/abuse
 * surface, not something "safe to ship alongside production" as this file
 * used to claim. Still available in dev/staging for prototype work.
 */
export async function POST(request: Request) {
  if (isProduction()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let body: {
    intent?: "ask" | "grade" | "chair_fly";
    question?: string;
    history?: { role: "user" | "assistant"; content: string }[];
    questionId?: string;
    optionId?: string;
    stepId?: string;
    answer?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  if (body.intent === "grade") {
    const q = KNOWLEDGE_CHECK.find((k) => k.id === body.questionId);
    if (!q) return NextResponse.json({ error: "Unknown question." }, { status: 400 });
    // Reflection questions have no right answer on purpose -- the point is
    // leaving with a cue you'll actually recall, not being marked.
    const isReflection = q.kind === "reflection";
    const correct = isReflection ? true : body.optionId === q.correctOptionId;
    return NextResponse.json({
      correct,
      isReflection,
      explanation: q.explanation,
      concept: correct && !isReflection ? null : q.concept,
    });
  }

  if (body.intent === "chair_fly") {
    const step = CHAIR_FLY.steps.find((s) => s.id === body.stepId);
    if (!step) return NextResponse.json({ error: "Unknown step." }, { status: 400 });
    const result = evaluateChairFly(step, body.answer ?? "");
    const idx = CHAIR_FLY.steps.findIndex((s) => s.id === step.id);
    const next = CHAIR_FLY.steps[idx + 1] ?? null;
    return NextResponse.json({ response: result.response, missed: result.missed, next });
  }

  const question = (body.question ?? "").trim();
  if (!question) return NextResponse.json({ error: "Ask something." }, { status: 400 });
  const reply = await askVector(question, body.history?.slice(-6) ?? []);
  return NextResponse.json(reply);
}
