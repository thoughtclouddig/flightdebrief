import Anthropic from "@anthropic-ai/sdk";
import { extractJson } from "./extract-json";
import { RESPONSE_SHAPE_INSTRUCTION, vectorCardSchema, type VectorCard } from "./vector-schema";
import {
  CHAIR_FLY,
  CONCEPTS,
  IMPROVING,
  INSTRUCTOR,
  INSTRUCTOR_DEBRIEF,
  LAST_FLIGHT,
  NEXT_LESSON,
  PERCEPTION_GAPS,
  RECURRING,
  STRUCTURED,
  STUDENT,
  SKILL_SCORES,
  STUDENT_REFLECTION,
  type ChairFlyStep,
} from "@/lib/prototype/vector-data";

/**
 * Vector -- the conversational surface over one student's own training record.
 *
 * The product claim Vector exists to prove is narrow: that answering from
 * THIS student's flights, instructors and unresolved items is materially
 * more useful than opening a general-purpose model and re-explaining
 * everything. So the system prompt leads with the training context and only
 * then permits general aviation knowledge, and the attribution rules are
 * structural rather than stylistic.
 *
 * Same Claude-or-mock shape as lib/ai/radio-judge.ts and lib/ai/index.ts:
 * the prototype must be clickable with no API key, because "does this feel
 * useful" cannot be evaluated against a spinner.
 */

const MODEL = "claude-sonnet-5";
const REQUEST_TIMEOUT_MS = 30_000;

export interface VectorReply {
  card: VectorCard;
  /** True when this came from Claude; false when the local responder answered. */
  live: boolean;
}

/**
 * The student's record, rendered for the model.
 *
 * Written as labelled evidence rather than prose so the attribution rules
 * below have something to point at -- the model can say "Jake said" only
 * because the instructor's words are marked as the instructor's.
 */
export function buildTrainingContext(): string {
  return `
STUDENT: ${STUDENT.fullName} (goes by ${STUDENT.firstName}), ${STUDENT.hours} hours, working toward ${STUDENT.certificate}.
CURRENT INSTRUCTOR: ${INSTRUCTOR.fullName} (${INSTRUCTOR.firstName}).
NEXT LESSON: ${NEXT_LESSON.date} ${NEXT_LESSON.time} with ${NEXT_LESSON.instructor}. Planned focus: ${NEXT_LESSON.focus}.

MOST RECENT FLIGHT: ${LAST_FLIGHT.date}, ${LAST_FLIGHT.lesson}, ${LAST_FLIGHT.duration} hours, ${LAST_FLIGHT.aircraft}.

WHAT THE INSTRUCTOR SAID (verbatim, spoken debrief -- attribute to ${INSTRUCTOR.firstName}):
"${INSTRUCTOR_DEBRIEF}"

WHAT THE STUDENT SAID (her own reflection, recorded before she saw his -- attribute to her):
"${STUDENT_REFLECTION}"

STRUCTURED FROM THAT DEBRIEF:
- Went well: ${STRUCTURED.wentWell.join(" | ")}
- Needs work: ${STRUCTURED.needsWork.join(" | ")}
- Instructor emphasis: ${STRUCTURED.instructorEmphasis.map((e) => `"${e.quote}"`).join(" ")}
- Next-flight focus: ${STRUCTURED.nextFlightFocus.join(" | ")}

WHERE THEY SAW IT DIFFERENTLY:
${PERCEPTION_GAPS.filter((g) => g.takeaway)
  .map((g) => `- ${g.task}: she -- ${g.studentView} / he -- ${g.instructorView}`)
  .join("\n")}

RECURRING ACROSS LESSONS: ${RECURRING.summary}
${RECURRING.lessons.map((l) => `  - Lesson ${l.n}, ${l.date}, with ${l.instructor}: ${l.note}`).join("\n")}

IMPROVING: ${IMPROVING.map((i) => `${i.skill} (${i.note})`).join(" | ")}

PER-SKILL SCORES (context, NOT the whole truth -- the evidence under each one matters more than the number):
${SKILL_SCORES.map((s) => `- ${s.skill}: ${s.score}/${s.max} (${s.state}). ${INSTRUCTOR.firstName} said: "${s.instructorEvidence}"`).join("\n")}
`.trim();
}

const SYSTEM = `You are Vector, the AI flight trainer built into AfterFlight.

You are NOT a general chatbot. You are the conversational interface to ONE student's actual training record, which is provided below. Your entire reason to exist is that you already know what she flew, what her instructor said, what she misunderstood, and what she is working on next -- so she does not have to explain it to a general-purpose model.

HOW TO ANSWER
- Start from her training record. Reach for general aviation knowledge only when the record does not contain the answer, and then connect it back to her flights.
- Never answer generically when student-specific evidence exists. If Jake flagged something twice, say so.
- You are not writing prose. You are returning structured data that the app renders as native UI. Be ruthlessly short: a summary she can read in one glance, and a handful of one-line points.
- Per-skill scores are context, never the answer on their own. If she asks about a skill, lead with what her instructor actually said and what it means for the next flight; the number is shorthand for that evidence, not a substitute for it. Never total the scores or derive an overall figure from them.

ATTRIBUTION -- non-negotiable, this is what makes Vector trustworthy
- Instructor guidance: "Jake said..." / "Jake flagged..." Never present your own inference as something the instructor said.
- Her own words: "You said..." / "In your reflection..."
- Earlier lessons: "In your lesson on Aug 12..."
- FAA/handbook material: name the source.
- Your own synthesis: make it audible -- "Putting those together..." / "The pattern I'd read from that..."
Never blur these. Never invent a quote.

AUTHORITY -- hard limits
- You are not a CFI and you do not have signoff authority. Never say she is ready to solo, ready for a checkride, or safe to fly a maneuver.
- Never say her instructor is wrong. When she and Jake saw a flight differently, treat it as two honest perspectives on the same flight and turn it into something to work on.
- If she asks whether she's ready for something, redirect: these are the unresolved items her instructor has identified, and that call is his.

TONE
Calm, concise, practical, aviation-competent. No fake enthusiasm, no generic encouragement, no long lectures, no exclamation marks. Confident where the evidence is strong; careful where it is thin.`;

export async function askVector(question: string, history: { role: "user" | "assistant"; content: string }[] = []): Promise<VectorReply> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { card: mockCard(question), live: false };

  try {
    const client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 900,
      system: `${SYSTEM}\n\n--- THIS STUDENT'S TRAINING RECORD ---\n${buildTrainingContext()}\n\n--- RESPONSE FORMAT ---\n${RESPONSE_SHAPE_INSTRUCTION}`,
      messages: [...history, { role: "user" as const, content: question }],
    });
    const raw = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    // Schema has .default() on every field, so a partial object still renders
    // rather than throwing -- same hardening as lib/ai/schema.ts.
    const parsed = vectorCardSchema.safeParse(JSON.parse(extractJson(raw)));
    if (!parsed.success) {
      console.error("[vector] response did not match the card schema; using local responder");
      return { card: mockCard(question), live: false };
    }
    return { card: parsed.data, live: true };
  } catch (err) {
    console.error("[vector] Claude call failed, using local responder:", err);
    return { card: mockCard(question), live: false };
  }
}

/**
 * Local responder, used when there is no API key.
 *
 * Returns the same VectorCard shape as the live path, so the UI is exercised
 * identically either way -- the prototype must never be a spinner, and a mock
 * that returns a different shape would hide rendering bugs until the key is
 * set. Keyword-routed on purpose: deterministic beats clever for a demo.
 */
function mockCard(question: string): VectorCard {
  const q = question.toLowerCase();

  if (q.includes("mean") || q.includes("flare") || q.includes("relax")) {
    return {
      kind: "explanation",
      title: "Correction through touchdown",
      summary:
        "Jake is happy with your centerline control. What he flagged is what happens after: the aileron correction relaxes once you get into the flare.",
      evidence: [
        { source: "instructor", label: "Jake", text: "Centerline control was much better today, but you're still relaxing the correction once you get into the flare." },
        { source: "vector", label: "Vector", text: "Feeling like you're holding the correction and actually holding it are different things as you slow down." },
      ],
      keyPoints: [
        "Control effectiveness drops as airspeed decays",
        "Same deflection does less work in the flare",
        "Expect near-full aileron by rollout",
        "Don't relax anything until taxi speed",
      ],
      stats: [],
      nextAction: { label: "Chair-fly this", target: "chair-fly" },
      detail:
        "In the flare you are slower than at any other point in the approach. Aerodynamic force on the control surfaces falls with the square of airspeed, so holding a fixed aileron position produces progressively less roll authority exactly as the crosswind's effect becomes most visible. The input has to keep growing to hold the same correction.",
    };
  }

  if (q.includes("keep") || q.includes("why does") || q.includes("speed") || q.includes("again")) {
    return {
      kind: "recurrence",
      title: "Stabilized approach speed",
      summary:
        "This has come up in three recent lessons and across two instructors, so it isn't one instructor's preference. The pattern is that speed control slips as the pattern gets busy.",
      evidence: [
        { source: "instructor", label: "Jake, Aug 29", text: "You were a little fast on two of the approaches." },
        { source: "instructor", label: "Dana, Jul 18", text: "Carrying five to ten extra knots on final." },
        { source: "vector", label: "Vector", text: "The fix is earlier configuration, not more attention on short final." },
      ],
      keyPoints: [
        "Configuration complete before the turn to final",
        "65 KIAS by short final",
        "If you're fixing speed at the threshold, go around",
      ],
      stats: [
        { value: "3", label: "lessons" },
        { value: "2", label: "instructors" },
      ],
      nextAction: { label: "Train this", target: "train" },
      detail: null,
    };
  }

  if (q.includes("quiz") || q.includes("test me") || q.includes("questions")) {
    return {
      kind: "recommendation",
      title: "Three from Thursday",
      summary: "Questions from your own flight — crosswind correction and approach speed, the two Jake left open.",
      evidence: [],
      keyPoints: ["Grounded in Thursday's debrief", "No score shown", "Miss one and I'll teach that concept"],
      stats: [],
      nextAction: { label: "Start the check", target: "quiz" },
      detail: null,
    };
  }

  if (q.includes("thursday") || q.includes("next flight") || q.includes("prepare") || q.includes("review") || q.includes("study") || q.includes("remember")) {
    return {
      kind: "next_flight",
      title: "Thursday with Jake",
      summary: "Crosswinds again. Two things carry over from Aug 29 — one Jake raised this lesson, one that predates him.",
      evidence: [
        { source: "instructor", label: "Jake", text: "Get stabilized earlier so you're not trying to fix the speed at the threshold." },
      ],
      keyPoints: [
        "65 KIAS by short final — no faster",
        "Configured and stable before the threshold",
        "Aileron keeps going in as you slow",
        "Correction stays in until you're rolling straight",
      ],
      stats: [],
      nextAction: { label: "Chair-fly this lesson", target: "chair-fly" },
      detail: null,
    };
  }

  if (q.includes("ready") || q.includes("solo") || q.includes("checkride")) {
    return {
      kind: "progress",
      title: "That's Jake's call",
      summary:
        "I don't have signoff authority and I'm not going to guess at it. What I can tell you is what's still open on your record.",
      evidence: [
        { source: "vector", label: "Vector", text: "Two items are unresolved: crosswind correction through touchdown, and being stabilized before short final." },
      ],
      keyPoints: ["Crosswind correction — raised Aug 29", "Stabilized approach — 3 lessons, 2 instructors", "Worth asking Jake directly on Thursday"],
      stats: [],
      nextAction: null,
      detail: null,
    };
  }

  if (q.includes("improv") || q.includes("better") || q.includes("progress")) {
    return {
      kind: "progress",
      title: "What's moving",
      summary: "Three skills are clearly improving. Two are still open, and both are on Thursday's plan.",
      evidence: [{ source: "instructor", label: "Jake", text: "Centerline control was much better today." }],
      keyPoints: [
        "Radio work — confident three lessons running",
        "Short-field — aiming point on three of four",
        "Centerline control — called out by name",
      ],
      stats: [
        { value: "3", label: "improving" },
        { value: "2", label: "still open" },
      ],
      nextAction: { label: "See progress", target: "progress" },
      detail: null,
    };
  }

  if (q.includes("chair") || q.includes("walk me") || q.includes("rehears") || q.includes("scenario")) {
    return {
      kind: "recommendation",
      title: "Crosswind at KSQL",
      summary: "Left crosswind, about 12 knots, Runway 30. I'll set the scene and stop at each decision point.",
      evidence: [],
      keyPoints: ["Three decision points", "I won't explain first — you answer", "Bound to Thursday's focus"],
      stats: [],
      nextAction: { label: "Start the scenario", target: "chair-fly" },
      detail: null,
    };
  }

  return {
    kind: "explanation",
    title: "What I've got",
    summary: "Thursday's flight with Jake, your own reflection from it, and the six lessons before it.",
    evidence: [],
    keyPoints: [
      "Crosswind correction through touchdown — open",
      "Stabilized approach speed — open, and older",
      "Ask about either, or say \"quiz me\"",
    ],
    stats: [],
    nextAction: null,
    detail: null,
  };
}

/**
 * Evaluates one chair-fly answer.
 *
 * Coverage-based rather than exact-match, for the reason spelled out in
 * lib/ai/radio-judge.ts: a student who phrases a correct answer differently
 * and is told they're wrong learns the wrong lesson and stops trusting it.
 */
export function evaluateChairFly(step: ChairFlyStep, answer: string): { hit: string[]; missed: boolean; response: string } {
  const a = answer.toLowerCase();
  const hit = step.looksFor.filter((k) => a.includes(k));
  const missed = hit.length < 2;
  const response = missed
    ? `Not quite the whole picture. ${step.idealAnswer}`
    : `That's the shape of it. ${step.idealAnswer}`;
  return { hit, missed, response };
}

export { CHAIR_FLY, CONCEPTS };
