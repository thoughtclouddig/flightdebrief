/**
 * Hardcoded visual fixtures for the /design/train mockup ONLY.
 *
 * No TrainingItem, no Repository, no database -- this exists so the mockup
 * route (app/design/train) can be reviewed in a browser before any of it
 * touches production Train. The four cases are deliberately the same four
 * instructional shapes lib/student/vector-coaching.ts's resolveVectorStrategy
 * already distinguishes (a known rehearsal mechanism, a genuinely ambiguous
 * one, a knowledge gap, and a clean transfer) -- this mockup is proposing
 * how those four should LOOK, not proposing new instructional logic.
 */

export type DesignRecommendedTreatment = "chair-fly" | "radio-practice" | "coach" | null;

export interface DesignTrainingUnit {
  id: string;
  skillLabel: string;
  acsArea: string;
  evidence: { quote: string; instructorName: string; flightDate: string };
  /**
   * Null is a real, honest state here, not a loading gap -- case 2's whole
   * point is that the cause is genuinely ambiguous, so the card must not
   * name a mechanism it doesn't have. Vector still trains it; it just
   * doesn't get a "recommended treatment" badge.
   */
  recommendedTreatment: DesignRecommendedTreatment;
  recommendedTreatmentLabel: string | null;
}

export interface DesignTransferUnit {
  id: string;
  skillLabel: string;
  acsArea: string;
  evidence: { quote: string; instructorName: string; flightDate: string };
  nextFlightObjective: string;
}

export const CONTEXT_LINE = "Starting where your last flight ended — Sep 10 with Jake.";
export const CONTEXT_SUBLINE = "Swipe through everything from that debrief — Vector just picked where to start.";

/** Case 1 -- Start Here. A known rehearsal/sequencing mechanism: Chair Flying is a real, named recommendation. */
export const CROSSWIND_LANDING: DesignTrainingUnit = {
  id: "crosswind-landing",
  skillLabel: "Crosswind landings",
  acsArea: "Normal and Crosswind Landing",
  evidence: {
    quote: "You're still relaxing the correction once you get into the flare.",
    instructorName: "Jake",
    flightDate: "Sep 10",
  },
  recommendedTreatment: "chair-fly",
  recommendedTreatmentLabel: "Vector recommends: Chair Flying",
};

/** Case 2 -- Also Train. Deliberately ambiguous: no mechanism badge, no pretending. */
export const TOWER_COMMUNICATIONS: DesignTrainingUnit = {
  id: "tower-communications",
  skillLabel: "Tower communications",
  acsArea: "Radio Communications and ATC Light Signals",
  evidence: {
    quote: "I need you to work on talking on the radio more confidently.",
    instructorName: "Jake",
    flightDate: "Sep 10",
  },
  recommendedTreatment: null,
  recommendedTreatmentLabel: null,
};

/** Case 3 -- Also Train. A real knowledge gap: coaching from the quote itself is the honest move, not a quiz for its own sake. */
export const SLOW_FLIGHT_KNOWLEDGE: DesignTrainingUnit = {
  id: "slow-flight-knowledge",
  skillLabel: "Slow flight",
  acsArea: "Maneuvering During Slow Flight",
  evidence: {
    quote: "You seemed unsure why we were adding more aileron as we slowed.",
    instructorName: "Jake",
    flightDate: "Sep 10",
  },
  recommendedTreatment: "coach",
  recommendedTreatmentLabel: "Vector recommends: A quick knowledge check",
};

/** Case 4 -- the transfer treatment: a real Needs Work item where the honest move is the airplane, not another screen. */
export const STEEP_TURNS_TRANSFER: DesignTransferUnit = {
  id: "steep-turns-transfer",
  skillLabel: "Steep turns",
  acsArea: "Steep Turns",
  evidence: {
    quote: "You lost about 100 feet in the second steep turn — nothing structural, just needs another rep in the airplane.",
    instructorName: "Jake",
    flightDate: "Sep 10",
  },
  nextFlightObjective: "Hold altitude within 100 feet through both directions of a steep turn.",
};

/** Two more of this debrief's units -- part of the same swipeable deck as everything else, not a separate hidden overflow list. */
export const SHORT_FIELD_LANDING: DesignTrainingUnit = {
  id: "short-field-landing",
  skillLabel: "Short-field landings",
  acsArea: "Short-Field Approach and Landing",
  evidence: { quote: "Touchdown point was long by a couple hundred feet on the second one.", instructorName: "Jake", flightDate: "Sep 10" },
  recommendedTreatment: null,
  recommendedTreatmentLabel: null,
};

export const AIRSPACE_KNOWLEDGE: DesignTrainingUnit = {
  id: "airspace-knowledge",
  skillLabel: "Airspace",
  acsArea: "National Airspace System",
  evidence: { quote: "Let's go back over the Class D entry requirements before next time.", instructorName: "Jake", flightDate: "Sep 10" },
  recommendedTreatment: "coach",
  recommendedTreatmentLabel: "Vector recommends: A quick knowledge check",
};

/**
 * Every card in the swipeable deck, in Vector's own ranked order -- position
 * 0 is where "Start here" lands, everything else is reached the same way
 * (swipe on mobile, arrows/dots on desktop), never a separate "more" list.
 * The transfer case is a real card in this deck too, just one that renders
 * without a Train-with-Vector CTA -- there's nothing to start for it.
 */
export type DesignDeckItem = ({ kind: "unit" } & DesignTrainingUnit) | ({ kind: "transfer" } & DesignTransferUnit);

export const DECK: DesignDeckItem[] = [
  { kind: "unit", ...CROSSWIND_LANDING },
  { kind: "unit", ...TOWER_COMMUNICATIONS },
  { kind: "unit", ...SLOW_FLIGHT_KNOWLEDGE },
  { kind: "unit", ...SHORT_FIELD_LANDING },
  { kind: "unit", ...AIRSPACE_KNOWLEDGE },
  { kind: "transfer", ...STEEP_TURNS_TRANSFER },
];

export interface DesignSkillProgress {
  skillLabel: string;
  state: "Needs Work" | "Improving";
  score: number;
  max: number;
}

/**
 * Recurring skills that need work across flights, not just this one --
 * deliberately distinct skills from anything in DECK above, since the whole
 * point is "this is bigger than today's debrief," matching the Sep 3
 * reference's own still-working-on section.
 */
export const STILL_WORKING_ON: DesignSkillProgress[] = [
  { skillLabel: "Stabilized Approach", state: "Needs Work", score: 2, max: 4 },
  { skillLabel: "Traffic Pattern Operations", state: "Improving", score: 3, max: 4 },
];
