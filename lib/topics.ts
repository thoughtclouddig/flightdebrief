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
  },
  {
    topic: "Short-field landings",
    keywords: ["short field landing", "short-field landing", "short field approach"],
    source: "Airplane Flying Handbook, Ch. 9 — Short-Field Approach and Landing",
    url: AFH_CH9_URL,
    category: "LANDINGS",
    skill: "SHORT_FIELD_LANDING",
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
