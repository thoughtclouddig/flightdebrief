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
export const CONTEXT_SUBLINE = "Vector picked one thing to start with. Everything else from that debrief is still here.";

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
  acsArea: "Radio Communications and ATC Light Signals",
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

/** Two lightweight filler units behind "View 2 more from this debrief," to show the progressive-disclosure pattern working. */
export const MORE_UNITS: DesignTrainingUnit[] = [
  {
    id: "short-field-landing",
    skillLabel: "Short-field landings",
    acsArea: "Short-Field Approach and Landing",
    evidence: { quote: "Touchdown point was long by a couple hundred feet on the second one.", instructorName: "Jake", flightDate: "Sep 10" },
    recommendedTreatment: null,
    recommendedTreatmentLabel: null,
  },
  {
    id: "airspace-knowledge",
    skillLabel: "Airspace",
    acsArea: "National Airspace System",
    evidence: { quote: "Let's go back over the Class D entry requirements before next time.", instructorName: "Jake", flightDate: "Sep 10" },
    recommendedTreatment: "coach",
    recommendedTreatmentLabel: "Vector recommends: A quick knowledge check",
  },
];
