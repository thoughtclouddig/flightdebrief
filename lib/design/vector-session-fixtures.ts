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
  | "check-error";

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
};

export const SESSION_SKILL_LABEL = "Crosswind landings";

export const SESSION_EVIDENCE = {
  label: "Jake · Sep 10",
  quote: "You're still relaxing the correction once you get into the flare.",
};

export const CHECK_QUESTION = "Why do we add more aileron as an airplane slows down in level flight?";

export const CHECK_RESULT = {
  feedback: "You've got it — that's exactly why the correction has to keep increasing as airspeed drops.",
  takeaway: "As you slow down, keep feeding in aileron to hold the bank you want — it won't stay put on its own.",
  citation: { source: "Airplane Flying Handbook, Ch. 5", url: "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/airplane_handbook" },
};

export const CHECK_RESULT_MISSED = {
  feedback: "Close, but the answer's really about how much less airflow is reaching the ailerons at low airspeed, not the angle of bank itself.",
  takeaway: "As you slow down, keep feeding in aileron to hold the bank you want — it won't stay put on its own.",
  citation: { source: "Airplane Flying Handbook, Ch. 5", url: "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/airplane_handbook" },
};

export const RADIO_MISSED_ELEMENT = "reading back the runway assignment before switching to tower frequency";

export const COACH_MESSAGE =
  "You add more aileron as you slow down because there's simply less air flowing over the wings and control surfaces at lower airspeeds — the same control input produces less effect, so it takes a bigger input to hold the same bank.";

export const TRANSFER_OBJECTIVE =
  "This came up in your debrief, but the next useful step is in the airplane. On your next flight, ask Jake to watch specifically for: relaxing the aileron correction once you're into the flare.";
