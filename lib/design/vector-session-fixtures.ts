/**
 * Hardcoded visual fixtures for the /design/train-vector mockup ONLY.
 *
 * No real backend call, no database -- these mirror the exact shapes
 * lib/student/vector-coaching.ts's VectorStrategy union already produces
 * (chair-fly, radio-practice train/diagnose/retry, coach, transfer, check),
 * plus the check flow's asking/loading/result/error stages from
 * components/student/vector-training-session.tsx. This mockup is proposing
 * how those real states should LOOK, not proposing new states -- there is
 * no state here without a real production counterpart.
 */

export type DesignVectorState =
  | "chair-fly"
  | "radio-train"
  | "radio-diagnose"
  | "radio-retry"
  | "coach"
  | "transfer"
  | "check-asking"
  | "check-loading"
  | "check-result"
  | "check-error"
  | "recall";

export const STATE_LABELS: Record<DesignVectorState, string> = {
  "chair-fly": "Chair Fly hand-off",
  "radio-train": "Radio Practice (rehearse)",
  "radio-diagnose": "Radio Practice (diagnose)",
  "radio-retry": "Radio Practice (retry)",
  coach: "Coach (known mechanism)",
  transfer: "Transfer (next flight)",
  "check-asking": "Knowledge check — asking",
  "check-loading": "Knowledge check — loading",
  "check-result": "Knowledge check — result",
  "check-error": "Knowledge check — error",
  recall: "Quick recall (sketch, not real)",
};

/**
 * SKETCH ONLY -- speculative, not a real VectorStrategy. Explores reviving
 * the old prototype's multiple-choice "Check Yourself" as a shallow
 * reinforcement pass that can follow Vector's own deep free-response
 * question, never a replacement for it. Same non-negotiable carried over
 * from the original: no score, ever -- "show me a score and it becomes
 * another thing I'm failing at" (components/prototype/knowledge-check.tsx).
 * Grounded in this session's own topic, not a generic question bank.
 */
export const RECALL_QUESTIONS: {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}[] = [
  {
    prompt: "As airspeed drops in the flare, the aileron correction you're holding needs to:",
    options: ["Stay exactly the same", "Increase", "Decrease", "Switch to rudder instead"],
    correctIndex: 1,
    explanation: "Less airflow over the control surfaces means the same input does less — so it takes more aileron to hold the same bank.",
  },
  {
    prompt: "Why does a fixed aileron input lose effectiveness as the airplane slows down?",
    options: [
      "The wind gets weaker as you get closer to the ground",
      "There's less airflow over the aileron to act on",
      "The airplane gets heavier as fuel burns off",
      "Ailerons only work above maneuvering speed",
    ],
    correctIndex: 1,
    explanation: "Aileron effectiveness comes from airflow, not altitude or weight — slower airspeed means less air moving over the control surface.",
  },
];

export const SESSION_SKILL_LABEL = "Crosswind landings";

export const SESSION_EVIDENCE = {
  label: "Jake · Sep 10",
  quote: "You're still relaxing the correction once you get into the flare.",
};

export const CHECK_QUESTION = "Why do we add more aileron as an airplane slows down in level flight?";

export const CHECK_RESULT = {
  feedback: "You've got it — that's exactly why the correction has to keep increasing as airspeed drops.",
  takeaway: "As you slow down, keep feeding in aileron to hold the bank you want — it won't stay put on its own.",
  citation: { source: "Airplane Flying Handbook, Ch. 5", url: "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/airplane_handbook" },
};

export const CHECK_RESULT_MISSED = {
  feedback: "Close, but the answer's really about how much less airflow is reaching the ailerons at low airspeed, not the angle of bank itself.",
  takeaway: "As you slow down, keep feeding in aileron to hold the bank you want — it won't stay put on its own.",
  citation: { source: "Airplane Flying Handbook, Ch. 5", url: "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/airplane_handbook" },
};

export const RADIO_MISSED_ELEMENT = "reading back the runway assignment before switching to tower frequency";

export const COACH_MESSAGE =
  "You add more aileron as you slow down because there's simply less air flowing over the wings and control surfaces at lower airspeeds — the same control input produces less effect, so it takes a bigger input to hold the same bank.";

export const TRANSFER_OBJECTIVE =
  "This came up in your debrief, but the next useful step is in the airplane. On your next flight, ask Jake to watch specifically for: relaxing the aileron correction once you're into the flare.";


/**
 * The real Chair Fly session (components/student/chair-fly-session.tsx) --
 * this fixture mirrors its exact shape (ChairFlyDrill/ChairFlyOption from
 * lib/prototype/chair-fly.ts): intro reason, one step at a time with
 * multiple-choice options, NO right/wrong marking on any option (the
 * product's one performance model lives in Vector's own diagnosis, not
 * here), then a carry-forward + next-flight close. Content follows the
 * same crosswind-landing thread as the rest of this session mockup rather
 * than a generic drill.
 */
export const CHAIR_FLY_DRILL = {
  objective: "Crosswind landings",
  scenario: "Runway 27, wind 240 at 15 gusting 22",
  estimatedMinutes: 4,
  reason: {
    studentLabel: "a normal crosswind landing",
    instructorLabel: "a landing where the correction faded right when it mattered most",
    instructorName: "Jake",
    date: "Sep 10",
    evidence: SESSION_EVIDENCE.quote,
  },
  guardrail:
    "This is prep to bring into the aircraft with your instructor — not a substitute for in-aircraft instruction.",
  steps: [
    {
      scene:
        "You're established on final for runway 27. The wind is 240 at 15, gusting 22 — nearly a direct crosswind.",
      prompt: "What control inputs are you holding right now?",
      options: [
        {
          id: "wing-low",
          text: "Wing low into the wind, opposite rudder to track the centerline",
          response:
            "That's the crosswind correction — aileron into the wind to stop the drift, rudder to keep the nose aligned with the runway.",
        },
        {
          id: "crab-only",
          text: "Level wings, crab angle only",
          response:
            "A crab alone drifts the airplane sideways the moment you flare, and the crab has to come out — you want the wing-low correction in by touchdown, not added after.",
        },
        {
          id: "no-correction-yet",
          text: "Wings level, no correction yet",
          response:
            "At this point on final the correction should already be established — waiting invites a late, rushed correction right at the flare.",
        },
      ],
      coaching: "The correction should already be in before you're this close — flare isn't when you start thinking about it.",
    },
    {
      scene: "You're in the flare now, a few feet over the runway, airspeed bleeding off fast.",
      prompt: "What happens to the aileron correction you're holding?",
      options: [
        {
          id: "increase",
          text: "It has to increase",
          response:
            "Right — less airflow over the ailerons means the same deflection does less, so it takes more aileron to hold the same bank as you slow down.",
        },
        {
          id: "same",
          text: "It stays about the same",
          response:
            "This is the exact moment Jake flagged — holding the same input isn't enough once you slow down, and the correction quietly fades just when the crosswind still needs it.",
        },
        {
          id: "relax",
          text: "It can start coming out",
          response:
            "Coming out of the correction here is what let the airplane drift in Jake's note — the crosswind hasn't stopped, you're just slower.",
        },
      ],
      instructorNote: "This is the exact moment I flagged — the drift starts here, not at touchdown.",
      coaching: "This moment decides the landing — hold what you have, then add to it.",
    },
    {
      scene: "Main wheels are down, you're still wing-low, rolling out into the crosswind.",
      prompt: "What do you do with the aileron?",
      options: [
        {
          id: "keep-increasing",
          text: "Keep increasing it as you slow down",
          response: "Yes — the same principle continues through rollout. Full aileron into the wind is normal by taxi speed.",
        },
        {
          id: "neutralize",
          text: "Neutralize it once the wheels are down",
          response:
            "The crosswind is still blowing after touchdown — neutralizing the correction here is how a gust gets under the upwind wing.",
        },
      ],
      coaching: "Rollout isn't a victory lap — the wind doesn't stop because the wheels are down.",
    },
  ],
  carryForward: [
    "The correction increases as you slow down — it's not a set-it-once input.",
    "Flare and rollout need more aileron, not less, right when it's tempting to relax.",
  ],
  nextFlight: {
    when: "Next flight",
    lesson: "Crosswind landings",
    focus: "Hold and increase the aileron correction through the flare and rollout, not just on final.",
  },
};

/**
 * The real Radio Practice session (components/radio-practice-session.tsx) --
 * this fixture mirrors lib/radio-practice-scenarios.ts's real, shipped
 * "initial-atis" scenario content directly (not invented), since a mockup
 * of a real feature should show what it actually says. Deterministic,
 * phrase-matched grading, not AI-judged, per that file's own design intent.
 */
export const RADIO_SCENARIO = {
  title: "Calling Ground after copying the ATIS",
  setup: "You've just copied the ATIS at the ramp and you're ready to call Ground for taxi.",
  atcCallTranscript:
    "Metro Airport information Kilo, one eight five three Zulu. Wind two seven zero at eight. Visibility one zero. Sky clear. Temperature two two, dew point one two. Altimeter three zero one two. Landing and departing runway two seven. Advise on initial contact you have information Kilo.",
  requiredElements: ["Your callsign", "Your position (at the ramp)", "That you have information Kilo", "Your request (taxi for takeoff)"],
  modelReadback:
    "Ground, Cessna one two three Alpha Bravo, at the ramp with information Kilo, ready to taxi for takeoff, VFR to the northwest.",
  source: "AIM 4-1-13",
  /** First attempt is deterministically incomplete (missing the ATIS-code element) so the sketch can show both outcomes without real speech recognition. */
  firstAttemptTranscript: "Ground, Cessna one two three Alpha Bravo, at the ramp, ready to taxi for takeoff, VFR to the northwest.",
  firstAttemptMatched: [true, true, false, true],
  secondAttemptTranscript:
    "Ground, Cessna one two three Alpha Bravo, at the ramp with information Kilo, ready to taxi for takeoff, VFR to the northwest.",
  coaching: "Close — the tower still needs to hear that you actually have the current ATIS before they'll taxi you.",
};
