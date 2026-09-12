import type { TrainingCategory, TrainingSkill } from "@/lib/types";

export interface StudyReference {
  topic: string;
  source: string;
  url: string;
  why: string;
}

// Direct chapter-level links (FAA-H-8083-3C / FAA-H-8083-25C current editions, verified
// against faa.gov's own per-chapter file listing) instead of the handbook's generic
// landing page -- a student clicking a "Crosswind Landings" reference should not land
// on a 260MB table of contents. AFH chapter numbers shifted in the 3C revision (e.g.
// Approaches & Landings moved from Ch.8 to Ch.9), so these are re-verified, not carried
// over from the prior edition's numbering.
const AFH_CH5_URL = "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/06_afh_ch5.pdf"; // Slow Flight, Stalls, and Spins
const AFH_CH8_URL = "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/09_afh_ch8.pdf"; // Airport Traffic Patterns
const AFH_CH9_URL = "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/10_afh_ch9.pdf"; // Approaches and Landings
const AFH_CH10_URL = "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/11_afh_ch10.pdf"; // Performance Maneuvers
const AFH_CH18_URL = "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/19_afh_ch18.pdf"; // Emergency Procedures
const PHAK_CH5_URL = "https://www.faa.gov/regulationspolicies/handbooksmanuals/aviation/phak/chapter-5-aerodynamics-flight";
const PHAK_CH16_URL = "https://www.faa.gov/regulationspolicies/handbooksmanuals/aviation/phak/chapter-16-navigation";
const AIM_CH4_URL = "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap_4.html"; // Air Traffic Control
const AFH_CH6_URL = "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/07_afh_ch6.pdf"; // Takeoffs and Departure Climbs
const AFH_CH7_URL = "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/08_afh_ch7.pdf"; // Ground Reference Maneuvers
const PHAK_CH2_URL = "https://www.faa.gov/regulationspolicies/handbooksmanuals/aviation/phak/chapter-2-aeronautical-decision-making";

/**
 * Curated topic -> FAA reference-material lookup, doubling as the taxonomy
 * backbone for structured training signals (see lib/taxonomy.ts). Kept
 * separate from the AI layer on purpose: citations like handbook chapter
 * numbers, and the normalized category/skill codes, should come from a
 * fixed table we control, not from an LLM. Works identically whether a
 * debrief was analyzed by Claude or the local mock analyzer.
 */
const TOPIC_LIBRARY: {
  topic: string;
  keywords: string[];
  /**
   * Null where no FAA chapter link has been verified for this topic. Only
   * URLs confirmed against faa.gov's own file listing appear here -- an
   * entry with nothing verified stays pickable in the task list but is
   * skipped by suggestStudyReferences rather than pointed at a guessed
   * chapter that may 404 or cite the wrong material.
   */
  source: string | null;
  url: string | null;
  category: TrainingCategory;
  skill: TrainingSkill;
  /**
   * Vector Train coaching content -- deliberately optional, deliberately
   * separate from `source`/`url`. Those two are citation metadata (which
   * resource grounds this topic); these are the actual instructional
   * substance Vector assembles a coaching card from. A citation alone is
   * not enough grounding for generated coaching text -- see
   * lib/student/vector-coaching.ts's own doc comment for why. Populated for
   * only the handful of topics that actually surface as recommendations in
   * practice; an entry without these stays a real, valid TOPIC_LIBRARY row
   * (citations/skill-matching still work), Vector's coaching just falls
   * back to evidence + citation for it instead of full preparation content.
   *
   * Every string here must read as GENERAL aviation guidance, never as an
   * observation about a specific student ("a common mistake is..." not
   * "you...") -- Vector's coaching pairs this with real per-student
   * evidence elsewhere on the card, and the two must never be
   * indistinguishable from each other.
   *
   * Human-reviewed against the cited FAA source before being treated as
   * approved production content -- never generated, never assumed correct
   * merely because it reads plausibly.
   */
  preparationPoints?: string[];
  /** Same rule as preparationPoints: general, not a specific student's error. */
  commonErrors?: string[];
  /**
   * Vector's one grounded knowledge-check question for this skill --
   * lib/ai/vector-coach.ts's evaluator is given expectedConcepts and
   * explanation as the ONLY material it may credit or reference; it is
   * never permitted to invent additional requirements. Reviewed here in
   * advance, same as preparationPoints/commonErrors -- never generated.
   * Optional for the same reason those are: only the topics that actually
   * surface as Vector recommendations need one yet.
   */
  checkQuestion?: {
    prompt: string;
    expectedConcepts: string[];
    explanation: string;
  };
}[] = [
  // --- ACS Area I & II: Preflight Preparation / Preflight Procedures -------
  {
    topic: "Weather & go/no-go decision",
    keywords: ["weather brief", "go/no-go", "go no go", "weather decision", "ceilings", "winds aloft"],
    source: "Pilot's Handbook of Aeronautical Knowledge, Ch. 2 — Aeronautical Decision-Making",
    url: PHAK_CH2_URL,
    category: "PREFLIGHT",
    skill: "WEATHER_BRIEFING",
  },
  {
    topic: "Weight and balance",
    keywords: ["weight and balance", "center of gravity", "cg was", "loading"],
    source: null,
    url: null,
    category: "PREFLIGHT",
    skill: "WEIGHT_BALANCE",
  },
  {
    topic: "Takeoff & landing performance",
    keywords: ["performance chart", "takeoff distance", "landing distance", "density altitude"],
    source: null,
    url: null,
    category: "PREFLIGHT",
    skill: "PERFORMANCE_PLANNING",
  },
  {
    topic: "Preflight inspection",
    keywords: ["preflight inspection", "walkaround", "walk-around", "walk around"],
    source: null,
    url: null,
    category: "PREFLIGHT",
    skill: "PREFLIGHT_INSPECTION",
  },
  {
    topic: "Flight deck management",
    keywords: ["flight deck management", "cockpit organization", "seat position", "chart set up"],
    source: null,
    url: null,
    category: "PREFLIGHT",
    skill: "FLIGHT_DECK_MANAGEMENT",
  },
  {
    topic: "Checklist discipline",
    keywords: ["checklist"],
    source: "Airplane Flying Handbook, Ch. 18 — Emergency Procedures",
    url: AFH_CH18_URL,
    category: "PREFLIGHT",
    skill: "CHECKLIST_DISCIPLINE",
  },

  // --- ACS Area III: Airport Operations ------------------------------------
  {
    topic: "Traffic pattern work",
    keywords: ["pattern work", "traffic pattern", "the pattern", "pattern altitude"],
    source: "Airplane Flying Handbook (FAA-H-8083-3C), Ch. 8 — Airport Traffic Patterns",
    url: AFH_CH8_URL,
    category: "AIRPORT_OPS",
    skill: "TRAFFIC_PATTERN",
  },
  {
    topic: "Taxiing",
    keywords: ["taxiing", "taxi to", "taxiway", "taxi speed"],
    source: null,
    url: null,
    category: "AIRPORT_OPS",
    skill: "TAXIING",
  },
  {
    topic: "Before-takeoff check / run-up",
    keywords: ["run-up", "runup", "run up", "before takeoff check"],
    source: null,
    url: null,
    category: "AIRPORT_OPS",
    skill: "BEFORE_TAKEOFF_CHECK",
  },
  {
    topic: "Airport markings & lighting",
    keywords: ["runway marking", "taxiway marking", "airport lighting", "hold short"],
    source: null,
    url: null,
    category: "AIRPORT_OPS",
    skill: "AIRPORT_MARKINGS",
  },

  // --- ACS Area IV: Takeoffs, Landings, and Go-Arounds ---------------------
  {
    topic: "Normal takeoff",
    keywords: ["normal takeoff", "departure climb", "rotation", "lift off"],
    source: "Airplane Flying Handbook, Ch. 6 — Takeoffs and Departure Climbs",
    url: AFH_CH6_URL,
    category: "TAKEOFFS",
    skill: "NORMAL_TAKEOFF",
  },
  {
    topic: "Short-field takeoffs",
    keywords: ["short field takeoff", "short-field takeoff"],
    source: "Airplane Flying Handbook, Ch. 6 — Short-Field Takeoff and Climb",
    url: AFH_CH6_URL,
    category: "TAKEOFFS",
    skill: "SHORT_FIELD_TAKEOFF",
  },
  {
    topic: "Soft-field takeoffs",
    keywords: ["soft field takeoff", "soft-field takeoff"],
    source: "Airplane Flying Handbook, Ch. 6 — Soft-Field Takeoff and Climb",
    url: AFH_CH6_URL,
    category: "TAKEOFFS",
    skill: "SOFT_FIELD_TAKEOFF",
  },
  {
    topic: "Crosswind takeoffs",
    keywords: ["crosswind takeoff"],
    source: "Airplane Flying Handbook, Ch. 6 — Crosswind Takeoff and Climb",
    url: AFH_CH6_URL,
    category: "TAKEOFFS",
    skill: "CROSSWIND_TAKEOFF",
  },
  {
    topic: "Landings",
    keywords: ["landing", "landings", "touch and go", "touch-and-go", "float", "floated", "flare"],
    source: "Airplane Flying Handbook, Ch. 9 — Approaches and Landings",
    url: AFH_CH9_URL,
    category: "LANDINGS",
    skill: "STABILIZED_APPROACH",
    preparationPoints: [
      "Get configured and on-speed early on final, rather than fixing airspeed right at the runway.",
      "Pick an aim point on the runway and hold it in the same spot in the windscreen all the way down.",
      "Keep making small corrections through the flare -- the airplane is still flying until the wheels are down.",
    ],
    commonErrors: [
      "Carrying extra airspeed into the flare, which causes floating and a longer landing.",
      "Fixating on the runway instead of using peripheral vision to judge flare height.",
    ],
    checkQuestion: {
      prompt: "As your airplane slows down through the flare, what should be happening to your control inputs, and why?",
      expectedConcepts: [
        "control inputs need to keep increasing as airspeed decreases",
        "the airplane is still flying until touchdown",
        "holding a fixed correction stops being enough as speed bleeds off",
      ],
      explanation:
        "Controls get less effective as airspeed drops, so holding the same input does less each moment -- you have to keep feeding in more correction through the flare, all the way to touchdown, rather than setting it once and holding it.",
    },
  },
  {
    topic: "Short-field landings",
    keywords: ["short field landing", "short-field landing", "short field approach"],
    source: "Airplane Flying Handbook, Ch. 9 — Short-Field Approach and Landing",
    url: AFH_CH9_URL,
    category: "LANDINGS",
    skill: "SHORT_FIELD_LANDING",
    preparationPoints: [
      "Plan a steeper, slower approach than normal so touchdown happens near minimum controllable airspeed.",
      "Identify the exact aim point before starting the approach, and fly it precisely.",
      "Be ready to apply maximum braking immediately after touchdown, once the nosewheel is firmly down.",
    ],
    commonErrors: [
      "Carrying extra airspeed \"for safety,\" which uses up the runway the technique is meant to save.",
      "Braking hard before the nosewheel is down, which can reduce braking effectiveness.",
    ],
    checkQuestion: {
      prompt: "Why does a short-field approach use a steeper, slower profile instead of a normal approach?",
      expectedConcepts: [
        "touchdown happens near minimum controllable airspeed",
        "less speed to dissipate means less runway used after touchdown",
        "a steeper approach clears an obstacle without carrying extra speed",
      ],
      explanation:
        "The whole point is to touch down slow and stop close to the aim point -- extra airspeed \"for safety\" uses up exactly the runway the technique exists to save.",
    },
  },
  {
    topic: "Soft-field landings",
    keywords: ["soft field landing", "soft-field landing", "soft field approach"],
    source: "Airplane Flying Handbook, Ch. 9 — Soft-Field Approach and Landing",
    url: AFH_CH9_URL,
    category: "LANDINGS",
    skill: "SOFT_FIELD_LANDING",
  },
  {
    topic: "Crosswind landings",
    keywords: ["crosswind"],
    source: "Airplane Flying Handbook, Ch. 9 — Crosswind Approach and Landing",
    url: AFH_CH9_URL,
    category: "LANDINGS",
    skill: "CROSSWIND_LANDING",
    preparationPoints: [
      "Establish the crosswind correction (wing low, opposite rudder) well before the flare, not during it.",
      "Keep increasing the aileron correction as airspeed decreases through the flare.",
      "Track the centerline with rudder, and control drift with aileron -- they're doing two different jobs.",
    ],
    commonErrors: [
      "Relaxing the crosswind correction too early once the mains touch down.",
      "Letting the nose drift off centerline while focused only on the wing-low correction.",
    ],
    checkQuestion: {
      prompt: "In a crosswind landing, what job is aileron doing versus rudder, and what happens if you relax the aileron correction right after the mains touch down?",
      expectedConcepts: [
        "aileron controls drift / holds the wing into the wind",
        "rudder keeps the nose tracking the centerline",
        "they're two different jobs, not one combined input",
        "relaxing aileron too early after touchdown lets the wind pick up the wing or drift the airplane",
      ],
      explanation:
        "Aileron holds the wing into the wind so you don't drift; rudder keeps the nose on the centerline. They're solving two different problems, and the crosswind is still blowing after touchdown, so the correction has to stay in -- not end at the mains.",
    },
  },
  {
    topic: "Forward slip to landing",
    keywords: ["forward slip", "slip to a landing", "slipping"],
    source: "Airplane Flying Handbook, Ch. 9 — Forward Slip to a Landing",
    url: AFH_CH9_URL,
    category: "LANDINGS",
    skill: "FORWARD_SLIP",
  },
  {
    topic: "Go-around",
    keywords: ["go-around", "go around"],
    source: "Airplane Flying Handbook, Ch. 9 — Go-Arounds",
    url: AFH_CH9_URL,
    category: "LANDINGS",
    skill: "GO_AROUND",
  },

  // --- ACS Area V: Performance and Ground Reference Maneuvers --------------
  {
    topic: "Steep turns",
    keywords: ["steep turn"],
    source: "Airplane Flying Handbook, Ch. 10 — Performance Maneuvers",
    url: AFH_CH10_URL,
    category: "MANEUVERS",
    skill: "STEEP_TURNS",
    preparationPoints: [
      "Pick a visual reference point on the horizon to hold altitude and bank angle against.",
      "Add back-pressure (and a touch of power) as bank increases, to hold altitude through the added load factor.",
      "Roll out with enough lead -- roughly half the bank angle -- to stop precisely on the entry heading.",
    ],
    commonErrors: [
      "Losing altitude as bank steepens, from not adding enough back-pressure.",
      "Rolling out late and overshooting the entry heading.",
    ],
    checkQuestion: {
      prompt: "As you roll into a steep turn, why do you need to add back-pressure, and what happens if you don't add enough?",
      expectedConcepts: [
        "steeper bank increases load factor",
        "more back-pressure/elevator is needed to maintain altitude at higher bank angles",
        "not enough back-pressure results in altitude loss",
      ],
      explanation:
        "Steepening the bank increases the load factor, so the wing needs more lift -- and more back-pressure -- to hold altitude. Without enough of it, the airplane descends as the bank increases.",
    },
  },
  {
    topic: "Rectangular course",
    keywords: ["rectangular course"],
    source: "Airplane Flying Handbook, Ch. 7 — Rectangular Course",
    url: AFH_CH7_URL,
    category: "MANEUVERS",
    skill: "RECTANGULAR_COURSE",
  },
  {
    topic: "S-turns",
    keywords: ["s-turn", "s turns", "s turns across a road"],
    source: "Airplane Flying Handbook, Ch. 7 — S-Turns",
    url: AFH_CH7_URL,
    category: "MANEUVERS",
    skill: "S_TURNS",
  },
  {
    topic: "Turns around a point",
    keywords: ["turns around a point", "turn around a point"],
    source: "Airplane Flying Handbook, Ch. 7 — Turns Around a Point",
    url: AFH_CH7_URL,
    category: "MANEUVERS",
    skill: "TURNS_AROUND_POINT",
  },
  {
    // Catch-all for a debrief that says "ground reference work" without naming
    // which maneuver -- keywords stay narrow so it doesn't double-classify a
    // sentence that already matched one of the three specific ones above.
    topic: "Ground reference maneuvers",
    keywords: ["ground reference maneuver", "ground reference work"],
    source: "Airplane Flying Handbook, Ch. 7 — Ground Reference Maneuvers",
    url: AFH_CH7_URL,
    category: "MANEUVERS",
    skill: "GROUND_REF_MANEUVERS",
  },
  {
    // Not an ACS Area of its own -- airspeed control is an element inside many
    // tasks. Filed under Maneuvers rather than given a one-item category.
    topic: "Airspeed control",
    keywords: ["airspeed", "on speed", "too fast on final", "too slow"],
    source: "Pilot's Handbook of Aeronautical Knowledge (FAA-H-8083-25C), Ch. 5 — Aerodynamics of Flight",
    url: PHAK_CH5_URL,
    category: "MANEUVERS",
    skill: "AIRSPEED_CONTROL",
  },

  // --- ACS Area VI: Navigation --------------------------------------------
  {
    topic: "Pilotage & dead reckoning",
    keywords: ["pilotage", "dead reckoning", "cross country", "cross-country", "checkpoint"],
    source: "Pilot's Handbook of Aeronautical Knowledge, Ch. 16 — Navigation",
    url: PHAK_CH16_URL,
    category: "NAVIGATION",
    skill: "NAVIGATION",
  },
  {
    topic: "Navigation systems & radar services",
    keywords: ["gps", "vor", "flight following", "radar service", "nav system"],
    source: "Pilot's Handbook of Aeronautical Knowledge, Ch. 16 — Navigation",
    url: PHAK_CH16_URL,
    category: "NAVIGATION",
    skill: "NAV_SYSTEMS",
  },
  {
    topic: "Diversion",
    keywords: ["diversion", "diverted", "divert to"],
    source: "Pilot's Handbook of Aeronautical Knowledge, Ch. 16 — Navigation",
    url: PHAK_CH16_URL,
    category: "NAVIGATION",
    skill: "DIVERSION",
  },
  {
    topic: "Lost procedures",
    keywords: ["lost procedure", "got lost", "disoriented over"],
    source: "Pilot's Handbook of Aeronautical Knowledge, Ch. 16 — Navigation",
    url: PHAK_CH16_URL,
    category: "NAVIGATION",
    skill: "LOST_PROCEDURES",
  },

  // --- ACS Area VII: Slow Flight and Stalls -------------------------------
  {
    topic: "Slow flight",
    keywords: ["slow flight"],
    source: "Airplane Flying Handbook, Ch. 5 — Slow Flight, Stalls, and Spins",
    url: AFH_CH5_URL,
    category: "SLOW_FLIGHT_STALLS",
    skill: "SLOW_FLIGHT",
    preparationPoints: [
      "Slow down gradually while trimming for the target airspeed, rather than fighting the controls.",
      "Use pitch primarily for airspeed and power primarily for altitude at this end of the speed range.",
      "Anticipate the larger control inputs coordination takes at low airspeed.",
    ],
    commonErrors: [
      "Being slow to add power when airspeed starts to decay below the target.",
      "Correcting a dropping wing with aileron instead of rudder, risking a cross-control condition.",
    ],
    checkQuestion: {
      prompt: "In slow flight, if a wing starts to drop, why should you correct it with rudder rather than aileron?",
      expectedConcepts: [
        "aileron at this low airspeed/high angle of attack can increase the down-going wing's angle of attack further",
        "risk of aggravating the stall or crossing the controls",
        "rudder corrects the yaw without adding to the wing's angle of attack",
      ],
      explanation:
        "At this end of the speed range, an aileron input can push the down-going wing's angle of attack even higher, risking a deeper stall on that wing. Rudder corrects the yaw without that risk, which is why it's the primary correction here.",
    },
  },
  {
    topic: "Power-off stalls",
    keywords: ["power off stall", "power-off stall", "approach to landing stall"],
    source: "Airplane Flying Handbook, Ch. 5 — Slow Flight, Stalls, and Spins",
    url: AFH_CH5_URL,
    category: "SLOW_FLIGHT_STALLS",
    skill: "POWER_OFF_STALLS",
  },
  {
    topic: "Power-on stalls",
    keywords: ["power on stall", "power-on stall", "departure stall"],
    source: "Airplane Flying Handbook, Ch. 5 — Slow Flight, Stalls, and Spins",
    url: AFH_CH5_URL,
    category: "SLOW_FLIGHT_STALLS",
    skill: "POWER_ON_STALLS",
  },
  {
    topic: "Accelerated stalls",
    keywords: ["accelerated stall"],
    source: "Airplane Flying Handbook, Ch. 5 — Slow Flight, Stalls, and Spins",
    url: AFH_CH5_URL,
    category: "SLOW_FLIGHT_STALLS",
    skill: "ACCELERATED_STALLS",
  },
  {
    topic: "Spin awareness",
    keywords: ["spin awareness", "incipient spin", "spin recovery"],
    source: "Airplane Flying Handbook, Ch. 5 — Slow Flight, Stalls, and Spins",
    url: AFH_CH5_URL,
    category: "SLOW_FLIGHT_STALLS",
    skill: "SPIN_AWARENESS",
  },
  {
    topic: "Stalls",
    keywords: ["stall"],
    source: "Airplane Flying Handbook, Ch. 5 — Slow Flight, Stalls, and Spins",
    url: AFH_CH5_URL,
    category: "SLOW_FLIGHT_STALLS",
    skill: "STALLS",
  },

  // --- ACS Area VIII: Basic Instrument Maneuvers ---------------------------
  {
    topic: "Straight & level (instrument reference)",
    keywords: ["straight and level under the hood", "hood work", "foggles"],
    source: null,
    url: null,
    category: "INSTRUMENT",
    skill: "INST_STRAIGHT_LEVEL",
  },
  {
    topic: "Climbs & descents (instrument reference)",
    keywords: ["constant airspeed climb", "constant airspeed descent"],
    source: null,
    url: null,
    category: "INSTRUMENT",
    skill: "INST_CLIMBS_DESCENTS",
  },
  {
    topic: "Turns to headings (instrument reference)",
    keywords: ["turns to headings", "turn to heading under"],
    source: null,
    url: null,
    category: "INSTRUMENT",
    skill: "INST_TURNS",
  },
  {
    topic: "Recovery from unusual attitudes",
    keywords: ["unusual attitude", "unusual attitudes"],
    source: null,
    url: null,
    category: "INSTRUMENT",
    skill: "UNUSUAL_ATTITUDES",
  },

  // --- ACS Area IX: Emergency Operations -----------------------------------
  {
    topic: "Emergency descent",
    keywords: ["emergency descent"],
    source: "Airplane Flying Handbook, Ch. 18 — Emergency Procedures",
    url: AFH_CH18_URL,
    category: "EMERGENCY",
    skill: "EMERGENCY_DESCENT",
  },
  {
    topic: "Emergency approach & landing",
    keywords: ["engine-out", "engine out", "forced landing", "emergency landing", "pick a field"],
    source: "Airplane Flying Handbook, Ch. 18 — Emergency Procedures",
    url: AFH_CH18_URL,
    category: "EMERGENCY",
    skill: "EMERGENCY_APPROACH",
  },
  {
    topic: "Engine fire",
    keywords: ["engine fire", "cabin fire", "electrical fire", "smoke in the cockpit"],
    source: "Airplane Flying Handbook, Ch. 18 — Emergency Procedures",
    url: AFH_CH18_URL,
    category: "EMERGENCY",
    skill: "ENGINE_FIRE",
  },
  {
    topic: "Systems & equipment malfunctions",
    keywords: ["system malfunction", "equipment malfunction", "alternator failure", "vacuum failure", "gear malfunction"],
    source: "Airplane Flying Handbook, Ch. 18 — Emergency Procedures",
    url: AFH_CH18_URL,
    category: "EMERGENCY",
    skill: "SYSTEMS_MALFUNCTIONS",
  },
  {
    topic: "Emergency equipment & survival gear",
    keywords: ["survival gear", "emergency equipment", "elt"],
    source: "Airplane Flying Handbook, Ch. 18 — Emergency Procedures",
    url: AFH_CH18_URL,
    category: "EMERGENCY",
    skill: "EMERGENCY_EQUIPMENT",
  },
  {
    topic: "Emergency procedures",
    keywords: ["emergency"],
    source: "Airplane Flying Handbook, Ch. 18 — Emergency Procedures",
    url: AFH_CH18_URL,
    category: "EMERGENCY",
    skill: "EMERGENCY_PROCEDURES",
    preparationPoints: [
      "Know the immediate memory items for an engine failure cold, before ever needing the checklist.",
      "Practice the flow: fly the airplane first, then pick a landing spot, then run the checklist.",
      "Think through the likely off-airport landing options in your own local area before needing one.",
    ],
    commonErrors: [
      "Fixating on restarting the engine at the expense of flying the airplane and picking a spot.",
      "Reaching for the checklist before establishing best-glide airspeed.",
    ],
    checkQuestion: {
      prompt: "Right after an engine failure, what's the correct order of priorities, and why?",
      expectedConcepts: [
        "fly the airplane first / establish best-glide airspeed",
        "then pick a landing spot",
        "then run the checklist / attempt a restart",
        "restart attempts should not come before flying the airplane or picking a spot",
      ],
      explanation:
        "Fly the airplane first -- establish best-glide airspeed -- then pick your spot, then work the checklist. Fixating on restarting the engine before those two is the most common way this goes wrong.",
    },
  },

  // --- ACS Area X & XI: Night Operations / Postflight ----------------------
  {
    topic: "Night operations",
    keywords: ["night flight", "night landing", "night currency", "after dark"],
    source: null,
    url: null,
    category: "NIGHT",
    skill: "NIGHT_OPERATIONS",
  },
  {
    topic: "After landing, parking & securing",
    keywords: ["after landing checklist", "securing the aircraft", "tie down", "tie-down"],
    source: null,
    url: null,
    category: "POSTFLIGHT",
    skill: "AFTER_LANDING",
  },

  // --- Cross-cutting: communications and ADM ------------------------------
  {
    topic: "Radio communications",
    keywords: ["radio communication", "radio call", "frequency change", "read back", "readback"],
    source: "Aeronautical Information Manual (AIM), Ch. 4 — Air Traffic Control",
    url: AIM_CH4_URL,
    category: "COMMUNICATIONS",
    skill: "RADIO_COMMUNICATIONS",
  },
  {
    topic: "Tower communications",
    keywords: ["radio", "tower", "clearance", "amended"],
    source: "Aeronautical Information Manual (AIM), Ch. 4 — Air Traffic Control",
    url: AIM_CH4_URL,
    category: "COMMUNICATIONS",
    skill: "TOWER_READBACKS",
  },
  {
    topic: "ATC light signals",
    keywords: ["light signal", "light gun"],
    source: "Aeronautical Information Manual (AIM), Ch. 4 — Air Traffic Control",
    url: AIM_CH4_URL,
    category: "COMMUNICATIONS",
    skill: "ATC_LIGHT_SIGNALS",
  },
  {
    topic: "Situational awareness",
    keywords: ["situational awareness", "lost track", "distracted", "task saturat"],
    source: "Pilot's Handbook of Aeronautical Knowledge, Ch. 2 — Aeronautical Decision-Making",
    url: PHAK_CH2_URL,
    category: "RISK_MANAGEMENT",
    skill: "SITUATIONAL_AWARENESS",
  },
  {
    topic: "Risk management",
    keywords: ["risk management", "decision making", "adm", "diverted due to", "went around because"],
    source: "Pilot's Handbook of Aeronautical Knowledge, Ch. 2 — Aeronautical Decision-Making",
    url: PHAK_CH2_URL,
    category: "RISK_MANAGEMENT",
    skill: "RISK_MANAGEMENT",
  },

];

export function detectTopics(text: string): string[] {
  const lower = text.toLowerCase();
  const found = TOPIC_LIBRARY.filter((t) => t.keywords.some((k) => lower.includes(k))).map((t) => t.topic);
  return found.length ? found : ["General flight training"];
}

/**
 * Given weak-area sentences (needsWork + actionItems, kept as separate
 * sentences rather than joined), suggest FAA reference material to study.
 * `why` is the literal sentence that triggered each match -- grounds the
 * recommendation instead of the UI having to invent a reason.
 */
export function suggestStudyReferences(weakAreaSentences: string[]): StudyReference[] {
  const seen = new Set<string>();
  const references: StudyReference[] = [];
  for (const sentence of weakAreaSentences) {
    const lower = sentence.toLowerCase();
    // Only entries with a verified FAA link can become a study reference --
    // see the source/url doc comment on TOPIC_LIBRARY.
    const matches = TOPIC_LIBRARY.filter(
      (t) => t.source !== null && t.url !== null && t.keywords.some((k) => lower.includes(k)),
    );
    for (const m of matches) {
      if (seen.has(m.source!)) continue;
      seen.add(m.source!);
      references.push({ topic: m.topic, source: m.source!, url: m.url!, why: sentence.trim() });
    }
  }
  return references.slice(0, 5);
}

/** Exposed for lib/taxonomy.ts -- the single source of truth for keyword -> category/skill classification. */
export function matchSkills(text: string): { category: TrainingCategory; skill: TrainingSkill }[] {
  const lower = text.toLowerCase();
  const matches = TOPIC_LIBRARY.filter((t) => t.keywords.some((k) => lower.includes(k)));
  const seen = new Set<TrainingSkill>();
  const results: { category: TrainingCategory; skill: TrainingSkill }[] = [];
  for (const m of matches) {
    if (seen.has(m.skill)) continue;
    seen.add(m.skill);
    results.push({ category: m.category, skill: m.skill });
  }
  return results;
}

/** Every catalogued skill/label/category triple, in TOPIC_LIBRARY order -- backs the CFI's "Flight Complete" task picker, grouped by category there. */
export function allTrainingSkills(): { skill: TrainingSkill; label: string; category: TrainingCategory }[] {
  return TOPIC_LIBRARY.map((t) => ({ skill: t.skill, label: t.topic, category: t.category }));
}

/** Human-readable label for a normalized skill code, e.g. "STABILIZED_APPROACH" -> "Landings". Falls back to the code itself for a code outside the fixed catalog (e.g. a CFI-authored custom FlightTask). */
export function skillLabel(skill: TrainingSkill | (string & {})): string {
  return TOPIC_LIBRARY.find((t) => t.skill === skill)?.topic ?? skill;
}

export interface CuratedTrainingGuidance {
  topic: string;
  preparationPoints: string[];
  commonErrors: string[];
  /** Null when no verified FAA link exists for this topic -- same honesty rule TOPIC_LIBRARY's own source/url already follow. */
  citation: { source: string; url: string } | null;
  /** Null when no reviewed knowledge-check question exists yet for this topic. */
  checkQuestion: { prompt: string; expectedConcepts: string[]; explanation: string } | null;
}

/**
 * Vector Train's coaching-content lookup -- returns null for any skill
 * without curated preparationPoints/commonErrors, rather than falling back
 * to just the citation. A caller (lib/student/vector-coaching.ts) that gets
 * null here degrades to evidence + citation only, honestly, instead of
 * treating a bare source string as if it were coaching substance.
 */
export function curatedTrainingGuidance(skill: TrainingSkill | (string & {})): CuratedTrainingGuidance | null {
  const entry = TOPIC_LIBRARY.find((t) => t.skill === skill);
  if (!entry || (!entry.preparationPoints?.length && !entry.commonErrors?.length)) return null;
  return {
    topic: entry.topic,
    preparationPoints: entry.preparationPoints ?? [],
    commonErrors: entry.commonErrors ?? [],
    citation: entry.source && entry.url ? { source: entry.source, url: entry.url } : null,
    checkQuestion: entry.checkQuestion ?? null,
  };
}

/**
 * The bare FAA citation for a skill, with no preparationPoints/commonErrors
 * requirement -- the honest fallback for curatedTrainingGuidance() returning
 * null. A skill can have a verified citation long before anyone has authored
 * coaching prose for it; this lets Vector still ground its recommendation in
 * a real source instead of offering nothing.
 */
export function citationForSkill(skill: TrainingSkill | (string & {})): { source: string; url: string } | null {
  const entry = TOPIC_LIBRARY.find((t) => t.skill === skill);
  return entry?.source && entry.url ? { source: entry.source, url: entry.url } : null;
}

/** The TrainingCategory a given skill rolls up to -- backs FlightScore's per-category grouping (see lib/flight-score.ts). Falls back to PROCEDURES for a code outside the fixed catalog. */
export function categoryForSkill(skill: TrainingSkill | (string & {})): TrainingCategory {
  return TOPIC_LIBRARY.find((t) => t.skill === skill)?.category ?? "PROCEDURES"; // legacy bucket for a code outside the catalog
}

/** Human-readable label for a TrainingCategory code, e.g. "AIRSPEED_CONTROL" -> "Airspeed Control". */
const CATEGORY_LABELS: Record<TrainingCategory, string> = {
  PREFLIGHT: "Preflight & Planning",
  AIRPORT_OPS: "Airport Operations",
  TAKEOFFS: "Takeoffs & Climbs",
  LANDINGS: "Approaches & Landings",
  MANEUVERS: "Performance & Ground Reference",
  SLOW_FLIGHT_STALLS: "Slow Flight & Stalls",
  NAVIGATION: "Navigation",
  INSTRUMENT: "Basic Instrument Maneuvers",
  EMERGENCY: "Emergency Operations",
  NIGHT: "Night Operations",
  POSTFLIGHT: "Postflight",
  COMMUNICATIONS: "Communications",
  RISK_MANAGEMENT: "Risk Management & ADM",
  // Retired as groupings (see TrainingCategory) -- labels kept so signals
  // written before the ACS alignment still render.
  PROCEDURES: "Procedures",
  AIRSPEED_CONTROL: "Airspeed Control",
};

export function categoryLabel(category: TrainingCategory): string {
  return CATEGORY_LABELS[category];
}
