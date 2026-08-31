import Anthropic from "@anthropic-ai/sdk";
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

export type VectorIntent = "ask" | "chair_fly";

export interface VectorReply {
  text: string;
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
`.trim();
}

const SYSTEM = `You are Vector, the AI flight trainer built into AfterFlight.

You are NOT a general chatbot. You are the conversational interface to ONE student's actual training record, which is provided below. Your entire reason to exist is that you already know what she flew, what her instructor said, what she misunderstood, and what she is working on next -- so she does not have to explain it to a general-purpose model.

HOW TO ANSWER
- Start from her training record. Reach for general aviation knowledge only when the record does not contain the answer, and then connect it back to her flights.
- Never answer generically when student-specific evidence exists. If Jake flagged something twice, say so.
- Be concise. Two or three short paragraphs at most. This is read on a phone, often at night, by someone tired.

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
  if (!apiKey) return { text: mockAnswer(question), live: false };

  try {
    const client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: `${SYSTEM}\n\n--- THIS STUDENT'S TRAINING RECORD ---\n${buildTrainingContext()}`,
      messages: [...history, { role: "user" as const, content: question }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return { text: text || mockAnswer(question), live: true };
  } catch (err) {
    console.error("[vector] Claude call failed, using local responder:", err);
    return { text: mockAnswer(question), live: false };
  }
}

/**
 * Local responder, used when there's no API key.
 *
 * Not a toy: the whole point of the prototype is judging whether grounded
 * answers feel different from generic ones, so these are written from the
 * same record the live model gets, with the same attribution discipline.
 * Keyword-routed on purpose -- deterministic beats clever for a demo.
 */
function mockAnswer(question: string): string {
  const q = question.toLowerCase();

  if (q.includes("mean") || q.includes("flare") || q.includes("relax")) {
    return `Jake said your centerline control was "much better today" -- that part he's happy with. What he flagged was what happens after: you're relaxing the aileron correction once you get into the flare.\n\nThe reason that matters is that control effectiveness drops as you slow down. In the flare you're slower than at any other point in the approach, so holding the same aileron does less work than it did a few seconds earlier. Feeling like you're holding the correction and actually holding it are two different things there.\n\nHis words for the fix were "keep the correction in all the way through touchdown." Practically: expect to keep feeding aileron in, close to full deflection by rollout.`;
  }

  if (q.includes("keep happening") || q.includes("keeps coming back") || q.includes("why does") || q.includes("speed")) {
    return `Approach speed has come up in three of your recent lessons, and across two instructors -- Dana flagged it on Jul 18, Jake on Aug 12 and again on Aug 29. That's worth knowing, because it means it isn't about one instructor's preference.\n\nThe pattern across those three is the same: your speed control slips when the pattern gets busy. Jake put it as fixing the speed at the threshold rather than being stable before it.\n\nSo the fix probably isn't more attention on short final -- it's getting configured earlier, so by the time you're on final there's nothing left to correct.`;
  }

  if (q.includes("quiz") || q.includes("test me") || q.includes("questions")) {
    return `Happy to. Three questions from Thursday's flight -- crosswind correction and approach speed, since those are the two Jake left open.\n\nOpen the Check Yourself card and I'll walk through them with you. If you miss one, I'll explain that specific concept rather than handing you a chapter.`;
  }

  if (q.includes("thursday") || q.includes("next flight") || q.includes("prepare") || q.includes("review") || q.includes("study")) {
    return `Thursday is crosswinds again with Jake. Two things carry over.\n\nFirst, the correction through touchdown -- that's the one Jake explicitly asked to continue. Second, being stabilized earlier, which is the older of the two problems and the one that has survived a change of instructor.\n\nIf you only have five minutes: read the crosswind concept card, then chair-fly the approach once. The cue to bring into the cockpit is "65 by short final, and the aileron keeps going in."`;
  }

  if (q.includes("ready") || q.includes("solo") || q.includes("checkride")) {
    return `That call is Jake's, not mine -- I don't have signoff authority and I'm not going to guess at it.\n\nWhat I can tell you is what's still open. Jake has two unresolved items on your record right now: crosswind correction held through touchdown, and being stabilized before short final rather than at it. The second has appeared in three lessons across two instructors.\n\nThose are the things worth asking him about directly.`;
  }

  if (q.includes("improv") || q.includes("better") || q.includes("progress") || q.includes("good")) {
    return `Three things are clearly moving. Radio work has been confident for three lessons running. Short-field technique is solid -- Jake had you hitting the aiming point on three of four. And centerline control is the one he called out by name this time as "much better."\n\nThe two still open are crosswind correction through touchdown, and approach speed. Both are on Thursday's plan.`;
  }

  if (q.includes("chair") || q.includes("walk me") || q.includes("rehears")) {
    return `Let's do the crosswind approach at KSQL -- left crosswind, about 12 knots, Runway 30. Open the Chair Fly card and I'll set the scene, stop at each decision point, and ask what you'd do.\n\nI won't explain first. Answer, and I'll tell you where you are.`;
  }

  return `I've got Thursday's flight with Jake, your reflection from it, and the six lessons before it.\n\nThe two things still open are crosswind correction held through touchdown, and being stabilized before short final. The second is the older one -- it's shown up in three lessons across two instructors.\n\nAsk me about either, or say "quiz me" and I'll pull questions from your own flight.`;
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
