import type { TrainingSkill } from "@/lib/types";

/**
 * First curated bank for the radio-communications practice feature -- see
 * app/(product)/home/page.tsx's "Assigned practice" card.
 *
 * Content policy: every scenario's phraseology structure and required
 * readback elements are grounded in a cited FAA Aeronautical Information
 * Manual (AIM) paragraph -- fetched and verified directly from the current
 * AIM PDF (https://www.faa.gov/air_traffic/publications/media/aim.pdf)
 * rather than guessed, same standard applied to lib/acs.ts's page links.
 * The AIM states phraseology *rules*, not a script of ready-made dialogue,
 * so the exact wording below is authored to those rules (the same thing any
 * ground-school scenario or CFI lesson plan does) -- it is not a verbatim
 * quotation of the source. "Podunk" as a placeholder non-towered airport
 * name and "Metro" as a placeholder towered one are deliberately generic,
 * non-real identifiers, matching the FAA's own convention of using
 * fictional airport names in illustrative examples.
 *
 * Deliberately NOT AI-generated: real-world readback correctness is a fixed
 * checklist of required elements (AIM 4-4-10, "Adherence to Clearance"),
 * not something that benefits from novel/varied phrasing -- same
 * "deterministic over AI-judged" philosophy already used by
 * lib/taxonomy.ts's classifyTrainingSignals. See lib/radio-practice-scoring.ts
 * for how scoringPhrases below is turned into a pass/fail per element.
 */

export type RadioScenarioPhase =
  | "initial_contact"
  | "taxi"
  | "before_takeoff"
  | "departure"
  | "en_route"
  | "pattern_nontowered"
  | "pattern_towered"
  | "landing"
  | "after_landing"
  | "lost_comm"
  | "emergency";

export const RADIO_SCENARIO_PHASE_LABEL: Record<RadioScenarioPhase, string> = {
  initial_contact: "Getting the Flight Going",
  taxi: "Taxi",
  before_takeoff: "Before Takeoff",
  departure: "Departure",
  en_route: "En Route",
  pattern_nontowered: "Pattern (Non-Towered)",
  pattern_towered: "Pattern (Towered)",
  landing: "Landing",
  after_landing: "After Landing",
  lost_comm: "Lost Comm / Radio Failure",
  emergency: "Emergency",
};

export interface RadioScenario {
  id: string;
  phase: RadioScenarioPhase;
  skill: TrainingSkill;
  title: string;
  /** Brief situational context shown to the student before the ATC call plays. */
  setup: string;
  /** What's heard on frequency -- spoken aloud via TTS. */
  atcCall: string;
  /** Required readback elements, in plain language -- shown to the student as what's being scored. */
  requiredElements: string[];
  /**
   * Acceptable phrasing alternatives for each entry in `requiredElements`,
   * same length/order -- e.g. requiredElements[0]'s scoringPhrases[0] might
   * be ["runway two seven", "runway 27"]. Any one alternative matching the
   * transcript satisfies that element. An empty outer array means this
   * scenario has no spoken readback to score (e.g. a visual-signal
   * recognition scenario) -- it's marked complete without judgment.
   */
  scoringPhrases: string[][];
  /** One example of a fully correct readback -- not the only acceptable phrasing, but a clear reference. */
  modelReadback: string;
  /** AIM paragraph this scenario's phraseology/requirement is grounded in. */
  source: string;
}

export const RADIO_PRACTICE_SCENARIOS: RadioScenario[] = [
  // --- Getting the flight going ------------------------------------------
  {
    // Rewritten. This scenario used to ask for the ATIS letter, the runway,
    // AND the altimeter -- the things you write on a kneeboard -- while
    // grading them against a call to Ground. Nobody reads the altimeter back
    // to Ground, so a student who made the correct call was marked wrong for
    // omitting something no pilot says. Copying the ATIS and calling Ground
    // are two different tasks; this one is the call.
    id: "initial-atis",
    phase: "initial_contact",
    skill: "RADIO_COMMUNICATIONS",
    title: "Calling Ground after copying the ATIS",
    setup:
      "You've copied the ATIS and you're at the ramp, ready to taxi for a VFR departure to the northwest.",
    atcCall:
      "Metro Airport information Kilo. One four five three Zulu. Wind two seven zero at eight. Visibility one zero. Ceiling four thousand five hundred broken. Temperature two two, dew point one two. Altimeter three zero one zero. Landing and departing Runway two seven. Advise on initial contact you have information Kilo.",
    // What the call to Ground actually contains: who you are, where you are,
    // what you want, and the acknowledgement the ATIS explicitly asked for.
    requiredElements: [
      "Your callsign",
      "Your position (at the ramp)",
      "That you have information Kilo",
      "Your request (taxi for takeoff)",
    ],
    scoringPhrases: [
      ["three alpha bravo", "3 alpha bravo", "one two three alpha bravo", "123 alpha bravo"],
      ["ramp", "at the ramp", "transient", "fbo"],
      ["information kilo", "with kilo", "have kilo", "kilo"],
      ["taxi", "ready to taxi", "taxi for takeoff"],
    ],
    modelReadback:
      "Ground, Cessna one two three Alpha Bravo, at the ramp with information Kilo, ready to taxi for takeoff, VFR to the northwest.",
    source: "AIM 4-1-13, Automatic Terminal Information Service (ATIS)",
  },
  {
    id: "initial-callup-ground",
    phase: "initial_contact",
    skill: "RADIO_COMMUNICATIONS",
    title: "Initial call-up to Ground",
    setup: "Engine's started, you have the ATIS, and you're ready to request taxi.",
    atcCall: "Cessna three Alpha Bravo, Metro Ground, taxi to Runway two seven via Alpha, hold short of Runway one eight.",
    requiredElements: ["Your callsign", "Taxi route/runway assignment (two seven via Alpha)", "Hold-short instruction (Runway one eight)"],
    scoringPhrases: [
      ["alpha bravo", "three alpha bravo"],
      ["two seven", "via alpha", "runway two seven"],
      ["hold short", "one eight", "runway one eight"],
    ],
    modelReadback: "Taxi to Runway two seven via Alpha, hold short of Runway one eight, three Alpha Bravo.",
    source: "AIM 4-2-3, Contact Procedures",
  },

  // --- Taxi ----------------------------------------------------------------
  {
    id: "taxi-hold-short",
    phase: "taxi",
    skill: "RADIO_COMMUNICATIONS",
    title: "Taxi clearance with a hold-short instruction",
    setup: "You're taxiing and Ground issues a route with a runway crossing to hold short of first.",
    atcCall: "Cessna three Alpha Bravo, taxi to Runway two seven via Charlie, hold short of Runway one eight.",
    requiredElements: ["Your callsign", "Assigned runway (two seven)", "Taxi route (via Charlie)", "Hold-short runway (one eight), verbatim"],
    scoringPhrases: [
      ["alpha bravo"],
      ["two seven", "runway two seven"],
      ["charlie", "via charlie"],
      ["hold short", "one eight"],
    ],
    modelReadback: "Taxi to Runway two seven via Charlie, hold short of Runway one eight, three Alpha Bravo.",
    source: "AIM 4-3-18, Taxiing; readback requirement per 4-4-10, Adherence to Clearance",
  },
  {
    id: "taxi-progressive",
    phase: "taxi",
    skill: "RADIO_COMMUNICATIONS",
    title: "Requesting progressive taxi instructions",
    setup: "The airport diagram is unfamiliar and you're not confident of the route Ground just gave.",
    atcCall: "Cessna three Alpha Bravo, roger, turn right on Bravo, then follow the Skyhawk ahead of you to Runway two seven.",
    requiredElements: ["Your callsign", "Each turn/instruction as given, in order"],
    scoringPhrases: [["alpha bravo"], ["bravo", "skyhawk", "two seven"]],
    modelReadback: "Right on Bravo, follow the Skyhawk to Runway two seven, three Alpha Bravo.",
    source: "AIM 4-3-18, Taxiing",
  },

  // --- Before takeoff --------------------------------------------------
  {
    id: "line-up-and-wait",
    phase: "before_takeoff",
    skill: "TOWER_READBACKS",
    title: "Line up and wait",
    setup: "You're holding short of Runway 27, ready for departure, but the tower isn't ready to release you yet.",
    atcCall: "Cessna three Alpha Bravo, Runway two seven, line up and wait.",
    requiredElements: ["Your callsign", "Assigned runway (two seven)", "\"Line up and wait\", verbatim"],
    scoringPhrases: [["alpha bravo"], ["two seven", "runway two seven"], ["line up and wait"]],
    modelReadback: "Line up and wait, Runway two seven, three Alpha Bravo.",
    source: "AIM 4-3-2, Airports with an Operating Control Tower",
  },
  {
    id: "takeoff-clearance",
    phase: "before_takeoff",
    skill: "TOWER_READBACKS",
    title: "Takeoff clearance",
    setup: "You're lined up on Runway 27 and the tower clears you for departure.",
    atcCall: "Cessna three Alpha Bravo, Runway two seven, cleared for takeoff.",
    requiredElements: ["Your callsign", "Assigned runway (two seven)", "\"Cleared for takeoff\", verbatim"],
    scoringPhrases: [["alpha bravo"], ["two seven", "runway two seven"], ["cleared for takeoff"]],
    modelReadback: "Cleared for takeoff, Runway two seven, three Alpha Bravo.",
    source: "AIM 4-3-2, Airports with an Operating Control Tower",
  },

  // --- Departure -------------------------------------------------------
  {
    id: "departure-frequency-change",
    phase: "departure",
    skill: "RADIO_COMMUNICATIONS",
    title: "Frequency change after departure",
    setup: "You're climbing out and the tower hands you off to departure.",
    atcCall: "Cessna three Alpha Bravo, contact Metro Departure, one two four point niner five.",
    requiredElements: ["Your callsign", "New frequency, read back digit-by-digit (one two four point niner five)"],
    scoringPhrases: [["alpha bravo"], ["one two four point niner five", "one two four point nine five", "124.95"]],
    modelReadback: "One two four point niner five, three Alpha Bravo.",
    source: "AIM 4-2-3, Contact Procedures",
  },

  // --- En route ------------------------------------------------------
  {
    id: "request-flight-following",
    phase: "en_route",
    skill: "RADIO_COMMUNICATIONS",
    title: "Requesting VFR flight following",
    setup: "You're clear of the Class D surface area, en route, and want traffic advisories for the rest of the flight.",
    atcCall: "(You are initiating this request -- there is no ATC prompt to react to.)",
    requiredElements: [
      "Facility name",
      "Your callsign, type aircraft",
      "Position",
      "Altitude",
      "Destination",
      "Request (\"request flight following\")",
    ],
    scoringPhrases: [
      ["metro approach", "approach"],
      ["alpha bravo"],
      ["west of metro", "ten miles west", "miles west"],
      ["four thousand five hundred", "4500"],
      ["podunk"],
      ["flight following"],
    ],
    modelReadback:
      "Metro Approach, Cessna three Alpha Bravo, a Skyhawk, ten miles west of Metro at four thousand five hundred, request flight following to Podunk.",
    source: "AIM 4-1-15, Radar Traffic Information Service",
  },
  {
    id: "acknowledge-traffic-advisory",
    phase: "en_route",
    skill: "SITUATIONAL_AWARENESS",
    title: "Acknowledging a traffic advisory",
    setup: "ATC calls traffic while you're receiving flight following. You need to look for it and respond correctly either way.",
    atcCall: "Cessna three Alpha Bravo, traffic ten o'clock, three miles, westbound, altitude unknown.",
    requiredElements: [
      "Your callsign",
      "\"Traffic in sight\" if you actually see it, OR \"Negative contact\" if you do not -- never claim traffic in sight you have not actually spotted",
    ],
    scoringPhrases: [["alpha bravo"], ["traffic in sight", "negative contact", "looking"]],
    modelReadback: "Negative contact, three Alpha Bravo. (Or: Traffic in sight, three Alpha Bravo -- only if actually seen.)",
    source: "AIM 4-1-15, Radar Traffic Information Service; Pilot/Controller Glossary, \"Traffic in Sight\" / \"Negative Contact\"",
  },

  // --- Pattern (non-towered) ---------------------------------------------
  {
    id: "nontowered-departure-call",
    phase: "pattern_nontowered",
    skill: "RADIO_COMMUNICATIONS",
    title: "Self-announcing a departure",
    setup: "You're departing Podunk, a non-towered airport, and announcing your intentions on the CTAF.",
    atcCall: "(No ATC -- this is a self-announce on the common traffic advisory frequency, not a call to acknowledge.)",
    requiredElements: ["Airport name, twice (start and end)", "Your callsign", "Position/intention", "Runway"],
    scoringPhrases: [
      ["podunk"],
      ["alpha bravo"],
      ["departing", "remaining in the pattern"],
      ["two seven", "runway two seven"],
    ],
    modelReadback: "Podunk traffic, Cessna three Alpha Bravo, departing Runway two seven, remaining in the pattern, Podunk.",
    source: "AIM 4-1-9, Traffic Advisory Practices at Airports Without Operating Control Towers",
  },
  {
    id: "nontowered-downwind",
    phase: "pattern_nontowered",
    skill: "TRAFFIC_PATTERN",
    title: "Self-announcing entering downwind",
    setup: "You're entering the traffic pattern at Podunk to land.",
    atcCall: "(No ATC -- self-announce on CTAF.)",
    requiredElements: ["Airport name, twice", "Your callsign", "Pattern leg and runway", "Intention (full stop / touch and go)"],
    scoringPhrases: [
      ["podunk"],
      ["alpha bravo"],
      ["downwind", "two seven"],
      ["full stop", "touch and go", "touch-and-go"],
    ],
    modelReadback: "Podunk traffic, Cessna three Alpha Bravo, entering left downwind Runway two seven, full stop, Podunk.",
    source: "AIM 4-1-9, Traffic Advisory Practices at Airports Without Operating Control Towers",
  },

  // --- Pattern (towered) -------------------------------------------------
  {
    id: "towered-extend-downwind",
    phase: "pattern_towered",
    skill: "TOWER_READBACKS",
    title: "Extend downwind for traffic",
    setup: "You're on downwind at a towered airport and the tower needs to sequence you behind other traffic.",
    atcCall: "Cessna three Alpha Bravo, extend downwind, I'll call your base.",
    requiredElements: ["Your callsign", "Acknowledge the instruction (extend downwind)"],
    scoringPhrases: [["alpha bravo"], ["extending downwind", "extend downwind"]],
    modelReadback: "Extending downwind, three Alpha Bravo.",
    source: "AIM 4-3-2, Airports with an Operating Control Tower",
  },
  {
    id: "towered-go-around",
    phase: "pattern_towered",
    skill: "GO_AROUND",
    title: "Instructed go-around",
    setup: "Short final, and the tower calls for a go-around because the runway isn't clear.",
    atcCall: "Cessna three Alpha Bravo, go around, traffic on the runway.",
    requiredElements: ["Your callsign", "Acknowledge \"going around\""],
    scoringPhrases: [["alpha bravo"], ["going around", "go around"]],
    modelReadback: "Going around, three Alpha Bravo.",
    source: "AIM 4-3-5, Unexpected Maneuvers in the Airport Traffic Pattern",
  },

  // --- Landing -----------------------------------------------------------
  {
    id: "landing-clearance",
    phase: "landing",
    skill: "TOWER_READBACKS",
    title: "Landing clearance",
    setup: "You're on final at a towered airport.",
    atcCall: "Cessna three Alpha Bravo, Runway two seven, cleared to land.",
    requiredElements: ["Your callsign", "Assigned runway (two seven)", "\"Cleared to land\", verbatim"],
    scoringPhrases: [["alpha bravo"], ["two seven", "runway two seven"], ["cleared to land"]],
    modelReadback: "Cleared to land, Runway two seven, three Alpha Bravo.",
    source: "AIM 4-3-2, Airports with an Operating Control Tower",
  },
  {
    id: "nontowered-final",
    phase: "landing",
    skill: "RADIO_COMMUNICATIONS",
    title: "Self-announcing final at a non-towered field",
    setup: "You're turning final to land at Podunk.",
    atcCall: "(No ATC -- self-announce on CTAF.)",
    requiredElements: ["Airport name, twice", "Your callsign", "\"Final\" and runway", "Intention"],
    scoringPhrases: [["podunk"], ["alpha bravo"], ["final"], ["full stop", "touch and go"]],
    modelReadback: "Podunk traffic, Cessna three Alpha Bravo, final Runway two seven, full stop, Podunk.",
    source: "AIM 4-1-9, Traffic Advisory Practices at Airports Without Operating Control Towers",
  },

  // --- After landing -------------------------------------------------
  {
    id: "exit-runway-ground-handoff",
    phase: "after_landing",
    skill: "RADIO_COMMUNICATIONS",
    title: "Exiting the runway and switching to Ground",
    setup: "You've landed and cleared the runway; the tower hands you to ground control.",
    atcCall: "Cessna three Alpha Bravo, taxi to parking, contact Ground point six.",
    requiredElements: ["Your callsign", "New frequency (point six -- shorthand for the tower frequency's matching Ground frequency)"],
    scoringPhrases: [["alpha bravo"], ["point six", "ground point six"]],
    modelReadback: "Ground point six, three Alpha Bravo.",
    source: "AIM 4-3-20, Exiting the Runway After Landing",
  },

  // --- Lost comm / radio failure --------------------------------------
  {
    id: "lost-comm-vfr",
    phase: "lost_comm",
    skill: "EMERGENCY_PROCEDURES",
    title: "Two-way radio failure -- VFR",
    setup:
      "Your radio has stopped transmitting or receiving. You're VFR. Say out loud, as if briefing your CFI, what you'd actually do.",
    atcCall: "(There is no ATC call to react to -- this is about what YOU do, not what you say on frequency.)",
    requiredElements: [
      "Continue the flight under VFR and land as soon as practicable",
      "Squawk 7600 on the transponder",
      "Try other means to reestablish contact before assuming you must divert",
    ],
    scoringPhrases: [
      ["continue vfr", "land as soon as practicable", "continue the flight"],
      ["seven six zero zero", "7600", "squawk seven six zero zero"],
      ["another frequency", "cell phone", "try to reestablish", "relay"],
    ],
    modelReadback:
      "I'd continue under VFR and land as soon as practicable, squawk seven six zero zero, and try another frequency or a cell phone before assuming I have to divert.",
    source: "AIM 6-4-1, Two-way Radio Communications Failure, referencing 14 CFR 91.185(b)",
  },
  {
    id: "lost-comm-towered-arrival",
    phase: "lost_comm",
    skill: "EMERGENCY_PROCEDURES",
    title: "Arriving lost-comm at a towered airport -- light gun signals",
    setup:
      "You're arriving at a towered airport with no radio. This one's a knowledge check, not a readback -- review the signal meanings below, then mark it done.",
    atcCall: "(The tower signals you with a light gun -- there's nothing to record a readback for.)",
    requiredElements: [
      "Steady green (in flight) = cleared to land",
      "Flashing red (in flight) = airport unsafe, do not land",
      "Steady red (in flight) = give way to other aircraft, continue circling",
      "Rock your wings or flash your landing light to acknowledge a signal was received",
    ],
    scoringPhrases: [],
    modelReadback: "(No radio call -- acknowledge by rocking wings or flashing your landing light, and comply with the signal given.)",
    source: "AIM 4-3-13, Traffic Control Light Signals",
  },

  // --- Emergency -----------------------------------------------------
  {
    id: "declaring-emergency-mayday",
    phase: "emergency",
    skill: "EMERGENCY_PROCEDURES",
    title: "Declaring an emergency -- engine roughness",
    setup: "You're experiencing rough engine operation in cruise and decide to declare an emergency and request assistance.",
    atcCall: "(You are initiating this call -- there is no ATC prompt to react to. Compose and speak your own emergency call.)",
    requiredElements: [
      "\"Mayday\" said three times (or \"Mayday\" once, clearly, is acceptable for training purposes)",
      "Your callsign",
      "Nature of the emergency",
      "Position and altitude",
      "Intentions",
      "Souls on board and fuel remaining, if time allows",
    ],
    scoringPhrases: [
      ["mayday"],
      ["alpha bravo"],
      ["engine", "rough"],
      ["four thousand five hundred", "south of metro"],
      ["request", "nearest airport", "vectors"],
      ["souls on board", "fuel remaining"],
    ],
    modelReadback:
      "Mayday, Mayday, Mayday, Cessna three Alpha Bravo, rough-running engine, ten miles south of Metro Airport at four thousand five hundred, request vectors for the nearest airport, two souls on board, one hour of fuel remaining.",
    source: "AIM 6-3-1, Distress and Urgency Communications; 6-1-2, Emergency Condition -- Request Assistance Immediately",
  },
  {
    id: "declaring-emergency-lost",
    phase: "emergency",
    skill: "EMERGENCY_PROCEDURES",
    title: "Requesting assistance -- lost / uncertain of position",
    setup: "You've lost track of your position and need help -- not an aircraft-systems emergency, but you still need ATC's help promptly.",
    atcCall: "(You are initiating this call.)",
    requiredElements: [
      "Your callsign",
      "Statement that you are uncertain of position (\"lost\")",
      "Last known position and heading",
      "Altitude",
      "Fuel remaining",
    ],
    scoringPhrases: [
      ["alpha bravo"],
      ["uncertain", "lost"],
      ["cedar lake", "heading north"],
      ["four thousand five hundred"],
      ["fuel remaining", "minutes of fuel"],
    ],
    modelReadback:
      "Metro Approach, Cessna three Alpha Bravo, I'm uncertain of my position, last known position was over Cedar Lake heading north, four thousand five hundred, forty-five minutes of fuel remaining, request assistance.",
    source: "AIM 6-1-2, Emergency Condition -- Request Assistance Immediately",
  },
];
