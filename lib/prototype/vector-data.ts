import type { PerformanceLevelCode } from "@/lib/performance-levels";

/**
 * Seeded training history for the Vector prototype.
 *
 * Deliberately a module, not database rows. The prototype has to be
 * evaluable without a migration, a reseed, or any risk to production data --
 * and the question it exists to answer ("does this feel like it helps me
 * learn?") does not depend on where the rows live. Everything downstream
 * (context builder, Vector, knowledge check) reads this shape, so
 * swapping it for real repository calls later is a single seam.
 *
 * The content is not decorative. The debrief language, the reflection, and
 * the six-lesson history are constructed so that the perception gap, the
 * cross-instructor recurrence, and the next-flight priorities all fall out
 * of the same source -- which is what the real product does.
 */

export const STUDENT = { firstName: "Mia", fullName: "Mia Chen", hours: 28.4, certificate: "Student Pilot" };
export const INSTRUCTOR = { firstName: "Jake", fullName: "Jake Alvarez" };
export const PRIOR_INSTRUCTOR = { firstName: "Dana", fullName: "Dana Whitfield" };

export const LAST_FLIGHT = {
  date: "Aug 29",
  route: "KSQL → KSQL",
  duration: "1.4",
  aircraft: "N4521P · Cessna 172S",
  lesson: "Crosswind + Short-Field Landings",
  instructor: INSTRUCTOR.fullName,
};

/** What Jake actually said, as spoken. The single source everything else derives from. */
export const INSTRUCTOR_DEBRIEF = `Centerline control was much better today. Short-field was pretty solid -- you hit your aiming point on three of four. On the crosswinds, you're still relaxing the correction once you get into the flare. You were also a little fast on two of the approaches. Next time I want to keep working crosswinds and get you stabilized earlier so you're not trying to fix the speed at the threshold.`;

/** Mia's own reflection, recorded before she saw Jake's. */
export const STUDENT_REFLECTION = `I thought the crosswinds were actually going pretty well. I felt much better keeping the airplane on centerline. I know I was fast on one approach but I thought the landings overall were pretty good.`;

export const STRUCTURED = {
  wentWell: [
    "Centerline control was noticeably better than last lesson",
    "Short-field technique was solid -- aiming point hit on three of four",
  ],
  needsWork: [
    "Aileron correction is being relaxed during the flare in a crosswind",
    "Approach speed was high on two of the four approaches",
  ],
  instructorEmphasis: [
    { quote: "Get stabilized earlier so you're not trying to fix the speed at the threshold.", who: INSTRUCTOR.firstName },
    { quote: "Keep the correction in all the way through touchdown.", who: INSTRUCTOR.firstName },
  ],
  nextFlightFocus: ["Crosswind correction through touchdown", "Stabilized approach speed"],
  cockpitCues: [
    "65 KIAS by short final -- no faster",
    "Configured and stable before the threshold, not at it",
    "Aileron keeps going in as the airplane slows",
    "Correction stays in until you're rolling straight",
  ],
};

export interface GapRow {
  task: string;
  studentLevel: PerformanceLevelCode;
  instructorLevel: PerformanceLevelCode;
  studentView: string;
  instructorView: string;
  takeaway: string | null;
}

/**
 * The perception gap, pre-resolved into the narrative shape the real
 * /compare route produces via lib/perception-gap.ts. Note the third row
 * agrees -- a page that only ever shows disagreement reads as an
 * indictment, and the real one has the same property.
 */
export const PERCEPTION_GAPS: GapRow[] = [
  {
    task: "Crosswind Landings",
    studentLevel: "INDEPENDENT",
    instructorLevel: "NEEDS_COACHING",
    studentView: "You felt crosswind landings were going pretty well.",
    instructorView:
      "Jake saw the centerline work improve, but wants the correction held all the way through touchdown before he'd call it consistent.",
    takeaway:
      "You agree the centerline control improved. The difference is what happens after that -- your confidence is slightly ahead of your consistency here, which makes it worth revisiting before the next flight.",
  },
  {
    task: "Stabilized Approach",
    studentLevel: "NEEDS_COACHING",
    instructorLevel: "NEEDS_COACHING",
    studentView: "You knew you were fast on one approach.",
    instructorView: "Jake counted two, and connected it to fixing speed late rather than configuring earlier.",
    takeaway:
      "You both landed in the same place. The useful detail is Jake's framing: the speed is a symptom of configuring late, not a separate problem.",
  },
  {
    task: "Short-Field Landing",
    studentLevel: "INDEPENDENT",
    instructorLevel: "INDEPENDENT",
    studentView: "You felt short-field went well.",
    instructorView: "Jake agreed -- aiming point hit on three of four.",
    takeaway: null,
  },
];

export interface HistoryLesson {
  n: number;
  date: string;
  instructor: string;
  note: string;
}

/**
 * Six lessons, two instructors. Stabilized approach speed appears in three
 * of them and spans the change from Dana to Jake -- which is the only claim
 * in the product that no competitor can compute.
 */
export const RECURRING = {
  skill: "Stabilized approach speed",
  lessonCount: 3,
  instructorCount: 2,
  summary: "Stabilized approach speed has come up in 3 lessons with 2 instructors.",
  interpretation:
    "This has improved, but it hasn't resolved. The pattern across those lessons is that speed control slips when the pattern gets busy -- so the fix is usually earlier configuration, not more attention at the threshold.",
  lessons: [
    { n: 3, date: "Jul 18", instructor: PRIOR_INSTRUCTOR.fullName, note: "Carrying five to ten extra knots on final." },
    { n: 5, date: "Aug 12", instructor: INSTRUCTOR.fullName, note: "Fast again on two approaches; fixing it late." },
    { n: 6, date: "Aug 29", instructor: INSTRUCTOR.fullName, note: "High on two of four approaches." },
  ] as HistoryLesson[],
};

export const IMPROVING = [
  { skill: "Radio work", note: "Confident and clear for three lessons running." },
  { skill: "Short-field technique", note: "Aiming point hit on three of four this lesson." },
  { skill: "Centerline control", note: "Jake called it noticeably better today." },
];

export const NEXT_LESSON = { date: "Thursday", time: "9:00 AM", instructor: INSTRUCTOR.fullName, focus: "Crosswind landings" };

/**
 * Per-skill scores.
 *
 * Allowed, and deliberately so: a score attached to ONE skill, with the
 * evidence that produced it visible next to it, is the clearest thing a
 * student can be shown. "Crosswind Landing 3/4, and here is the sentence
 * your instructor said" is immediately actionable.
 *
 * What is NOT allowed anywhere in this product is an aggregate --  no
 * overall FlightScore, no "72% solo ready", no "83% checkride ready". Those
 * imply AfterFlight can certify readiness, which it cannot: the signoff is
 * the instructor's and a forward verdict would put the product against the
 * person whose judgment actually governs. The rule is that a number must be
 * sourced, explainable and tied to a specific skill -- or it does not exist.
 *
 * Every field below the score exists to enforce that. `instructorEvidence`
 * is why the number is what it is, in the instructor's own words;
 * `studentTake` is her side where she said something about it;
 * `vectorRead` is clearly labelled as inference; `next` is what moves it.
 */
export type SkillState = "Needs Work" | "Improving" | "Meets Standard";

/**
 * FAA ACS Areas of Operation, used as a quiet structural layer.
 *
 * The point of carrying these is that the product reads as real flight
 * training rather than generic AI coaching. It is deliberately NOT an ACS
 * database: one Area name on a skill, the task code only on the skill-detail
 * screen, and no matrix anywhere.
 */
export const ACS_AREAS = {
  landings: "Takeoffs, Landings & Go-Arounds",
  airport: "Airport & Traffic Pattern Operations",
} as const;

export type AcsArea = (typeof ACS_AREAS)[keyof typeof ACS_AREAS];

export interface SkillScore {
  /** URL-safe id. The skill-detail route keys off this. */
  slug: string;
  skill: string;
  /** Out of `max`. Never summed across skills -- see the note above. */
  score: number;
  max: number;
  state: SkillState;
  /** The instructor's own words. Attribution stays structural. */
  instructorEvidence: string;
  /** Her reflection, where she said something about this skill. Null when she didn't. */
  studentTake: string | null;
  /** Vector's reading, always labelled as Vector's rather than the instructor's. */
  vectorRead: string;
  /** What moves this skill forward before the next lesson. */
  next: string;
  /** Set when this skill is also in the recurrence set, so the two surfaces agree. */
  recurring?: { lessons: number; instructors: number };
  /** ACS Area of Operation this task lives under, plus its task code. */
  acsArea: AcsArea;
  acsCode: string;
  /** The last few assessments of this one skill. Never summed with any other. */
  trend: { label: string; score: number; state: SkillState }[];
}

export const SKILL_SCORES: SkillScore[] = [
  {
    slug: "crosswind-landing",
    skill: "Crosswind Landing",
    score: 3,
    max: 4,
    state: "Improving",
    instructorEvidence:
      "Centerline control was much better today, but you're still relaxing the correction once you get into the flare.",
    studentTake: "You felt crosswind landings were going pretty well.",
    vectorRead:
      "You're close here. The centerline work is done -- the remaining issue is holding the correction through touchdown, which is the part that's still costing you consistency.",
    next: "A short review, then the crosswind chair-fly scenario before Thursday.",
    acsArea: ACS_AREAS.landings,
    acsCode: "PA.IV.E",
    trend: [
      { label: "Jul 18", score: 2, state: "Needs Work" },
      { label: "Aug 12", score: 2, state: "Needs Work" },
      { label: "Aug 29", score: 3, state: "Improving" },
    ],
  },
  {
    slug: "stabilized-approach",
    skill: "Stabilized Approach",
    score: 2,
    max: 4,
    state: "Needs Work",
    instructorEvidence:
      "You were a little fast on two of the approaches. I want you stabilized earlier so you're not trying to fix the speed at the threshold.",
    studentTake: "You knew you were fast on one approach.",
    vectorRead:
      "This is the older of your two open items and the one that has survived a change of instructor. The pattern is that speed control slips when the pattern gets busy, so the fix is earlier configuration rather than more attention on short final.",
    next: "Configuration complete before the turn to final. 65 KIAS by short final or go around.",
    recurring: { lessons: 3, instructors: 2 },
    acsArea: ACS_AREAS.landings,
    acsCode: "PA.IV.A",
    trend: [
      { label: "Jul 18", score: 1, state: "Needs Work" },
      { label: "Aug 12", score: 2, state: "Needs Work" },
      { label: "Aug 29", score: 2, state: "Needs Work" },
    ],
  },
  {
    slug: "short-field-landing",
    skill: "Short-Field Landing",
    score: 4,
    max: 4,
    state: "Meets Standard",
    instructorEvidence: "Short-field was pretty solid -- you hit your aiming point on three of four.",
    studentTake: "You felt short-field went well.",
    vectorRead: "You and Jake agree here, and this is the one skill from Thursday he didn't leave open.",
    next: "Nothing before Thursday. Keep it warm.",
    acsArea: ACS_AREAS.landings,
    acsCode: "PA.IV.G",
    trend: [
      { label: "Jul 18", score: 3, state: "Improving" },
      { label: "Aug 12", score: 3, state: "Improving" },
      { label: "Aug 29", score: 4, state: "Meets Standard" },
    ],
  },
  {
    slug: "radio-work",
    skill: "Radio Work",
    score: 4,
    max: 4,
    state: "Meets Standard",
    instructorEvidence: "No repeats needed all flight.",
    studentTake: null,
    vectorRead: "Confident and clear for three lessons running -- this stopped being a problem a while ago.",
    next: "Nothing.",
    acsArea: ACS_AREAS.airport,
    acsCode: "PA.III.A",
    trend: [
      { label: "Jul 18", score: 3, state: "Improving" },
      { label: "Aug 12", score: 4, state: "Meets Standard" },
      { label: "Aug 29", score: 4, state: "Meets Standard" },
    ],
  },
];

/** Lookup by slug for the skill-detail route. */
export function skillBySlug(slug: string): SkillScore | undefined {
  return SKILL_SCORES.find((s) => s.slug === slug);
}

/** Skills grouped under their ACS Area of Operation, in list order. */
export function skillsByAcsArea(): { area: AcsArea; skills: SkillScore[] }[] {
  const order: AcsArea[] = [ACS_AREAS.landings, ACS_AREAS.airport];
  return order
    .map((area) => ({ area, skills: SKILL_SCORES.filter((s) => s.acsArea === area) }))
    .filter((g) => g.skills.length > 0);
}

/**
 * The flight that has landed but has not been debriefed yet.
 *
 * Home is state-aware because a home screen that assumes a debrief already
 * happened has nothing to say in the twenty minutes that matter most -- the
 * ones right after shutdown, when the details are still in the student's head.
 */
export const PENDING_FLIGHT = {
  date: "Today",
  landedAt: "2:14 PM",
  lesson: "Crosswind + Short Field",
  instructor: INSTRUCTOR.firstName,
  aircraft: "N4521P · Cessna 172S",
  duration: "1.4",
};

export interface DebriefRecord {
  id: string;
  date: string;
  instructor: string;
  lesson: string;
  length: string;
}

/** Debrief history. The Debrief tab is a place to START one, not only to read one. */
export const DEBRIEFS: DebriefRecord[] = [
  { id: "latest", date: "Aug 29", instructor: INSTRUCTOR.firstName, lesson: "Crosswind + Short Field", length: "1:12" },
  { id: "aug-12", date: "Aug 12", instructor: INSTRUCTOR.firstName, lesson: "Pattern work + Go-arounds", length: "0:58" },
  { id: "jul-18", date: "Jul 18", instructor: PRIOR_INSTRUCTOR.firstName, lesson: "Slow flight + Landings", length: "1:31" },
];

export interface QuizQuestion {
  id: string;
  kind: "recall" | "application" | "scenario" | "reflection";
  prompt: string;
  options?: { id: string; text: string }[];
  correctOptionId?: string;
  /** Why the right answer is right, tied back to this student's own flight. */
  explanation: string;
  /** The concept to remediate if they miss it. */
  concept: string;
}

/** Three questions, all traceable to Jake's debrief rather than to a written-test bank. */
export const KNOWLEDGE_CHECK: QuizQuestion[] = [
  {
    id: "q1",
    kind: "application",
    prompt: "With a left crosswind, what should happen to your aileron input as the airplane slows through the flare?",
    options: [
      { id: "a", text: "Gradually reduce it as the airplane settles" },
      { id: "b", text: "Progressively increase it into the wind" },
      { id: "c", text: "Hold it exactly where it was on final" },
      { id: "d", text: "Neutralize it and use rudder alone" },
    ],
    correctOptionId: "b",
    explanation:
      "As airspeed decreases the controls become less effective, so holding the same deflection produces less correction. You need progressively more aileron into the wind, not less. This is exactly what Jake flagged -- you were relaxing the correction once you got into the flare.",
    concept: "crosswind-correction-through-touchdown",
  },
  {
    id: "q2",
    kind: "scenario",
    prompt:
      "You're on short final in a left crosswind and you notice you're 8 knots fast. What is the first thing to fix?",
    options: [
      { id: "a", text: "Add a slip to lose the speed before the flare" },
      { id: "b", text: "Accept it and plan to float a little further down the runway" },
      { id: "c", text: "Go around -- the approach isn't stable" },
      { id: "d", text: "Reduce power and pitch for the aiming point" },
    ],
    correctOptionId: "c",
    explanation:
      "8 knots fast on short final is an unstable approach, and the honest answer is a go-around. Jake's actual point was upstream of this: get configured earlier so you're not arriving at the threshold with a speed problem to solve. Fixing speed late is the pattern he's trying to break.",
    concept: "stabilized-approach-speed",
  },
  {
    id: "q3",
    kind: "reflection",
    prompt: "What cue will you use on Thursday to remember to keep the correction in through touchdown?",
    explanation:
      "There's no wrong answer here -- the point is to leave with one sentence you'll actually recall in the cockpit. Jake's version was \"keep the correction in all the way through touchdown.\"",
    concept: "crosswind-correction-through-touchdown",
  },
];

/** Short taught explanations. FAA material grounds them; it is not the experience. */
export const CONCEPTS: Record<
  string,
  { title: string; instructorMeant: string; whyItHappens: string; picture: string; commonMistake: string; nextTime: string[]; sources: string[] }
> = {
  "crosswind-correction-through-touchdown": {
    title: "Keeping crosswind correction through touchdown",
    instructorMeant:
      "Jake said your centerline control improved, but that you were relaxing aileron correction once you got into the flare.",
    whyItHappens:
      "Control effectiveness falls with airspeed. In the flare you are slower than at any other point in the approach, so the same amount of aileron does less work than it did five seconds earlier. If you hold the input steady, the correction is quietly decaying just as the crosswind's effect is at its most obvious.",
    picture: "Progressively more aileron into the wind as the airplane slows -- the input keeps growing until you're rolling straight.",
    commonMistake:
      "Relaxing the input the moment the wheels touch, which lets the upwind wing rise and drifts you off centerline during rollout.",
    nextTime: [
      "Keep feeding aileron in as the airplane slows -- expect near-full deflection by rollout",
      "Rudder holds the nose straight; aileron holds you on centerline. Different jobs.",
      "Don't relax anything until you're taxi speed",
    ],
    sources: ["FAA Airplane Flying Handbook, Ch. 9 — Crosswind Approach and Landing", "ACS: PA.IV.E — Crosswind Approach and Landing"],
  },
  "stabilized-approach-speed": {
    title: "Getting stabilized earlier",
    instructorMeant:
      "Jake counted two approaches where you were fast, and connected it to configuring late rather than to the speed itself.",
    whyItHappens:
      "Speed on final is mostly decided before final. If configuration is late, you arrive at the threshold with energy to dissipate and very little time to do it, so the correction happens in the flare -- which is also where you're managing the crosswind. Two problems arrive at once.",
    picture: "Configured, trimmed and on speed by the time you roll onto final -- so short final is holding, not fixing.",
    commonMistake: "Carrying five to ten extra knots and planning to lose it in the flare, which is what produces float and a long touchdown.",
    nextTime: [
      "Configuration complete before you turn final",
      "65 KIAS by short final -- if it isn't there, it isn't stable",
      "If you're still fixing speed at the threshold, go around",
    ],
    sources: ["FAA Airplane Flying Handbook, Ch. 8 — Approaches and Landings", "ACS: PA.IV.A — Normal Approach and Landing"],
  },
};

/** Contextual suggested actions. Vector never opens as an empty box. */
export const SUGGESTED = {
  afterDebrief: [
    "What did Jake actually mean about the flare?",
    "Why does my approach speed keep coming back?",
    "Quiz me on today's weak areas",
    "Prepare me for Thursday",
  ],
  nextFlight: [
    "Give me a 5-minute review",
    "Quiz me before Thursday",
    "Chair-fly this lesson",
    "What should I remember before engine start?",
  ],
};
