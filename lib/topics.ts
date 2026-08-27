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
  source: string;
  url: string;
  category: TrainingCategory;
  skill: TrainingSkill;
}[] = [
  {
    topic: "Traffic pattern work",
    keywords: ["pattern work", "traffic pattern", "the pattern", "pattern altitude"],
    source: "Airplane Flying Handbook (FAA-H-8083-3C), Ch. 8 — Airport Traffic Patterns",
    url: AFH_CH8_URL,
    category: "MANEUVERS",
    skill: "TRAFFIC_PATTERN",
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
    topic: "Go-around",
    keywords: ["go-around", "go around"],
    source: "Airplane Flying Handbook, Ch. 9 — Go-Arounds",
    url: AFH_CH9_URL,
    category: "LANDINGS",
    skill: "GO_AROUND",
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
    topic: "Steep turns",
    keywords: ["steep turn"],
    source: "Airplane Flying Handbook, Ch. 10 — Performance Maneuvers",
    url: AFH_CH10_URL,
    category: "MANEUVERS",
    skill: "STEEP_TURNS",
  },
  {
    topic: "Slow flight",
    keywords: ["slow flight"],
    source: "Airplane Flying Handbook, Ch. 5 — Slow Flight, Stalls, and Spins",
    url: AFH_CH5_URL,
    category: "MANEUVERS",
    skill: "SLOW_FLIGHT",
  },
  {
    topic: "Stalls",
    keywords: ["stall"],
    source: "Airplane Flying Handbook, Ch. 5 — Slow Flight, Stalls, and Spins",
    url: AFH_CH5_URL,
    category: "MANEUVERS",
    skill: "STALLS",
  },
  {
    topic: "Emergency procedures",
    keywords: ["emergency", "engine-out", "engine out", "forced landing"],
    source: "Airplane Flying Handbook, Ch. 18 — Emergency Procedures",
    url: AFH_CH18_URL,
    category: "PROCEDURES",
    skill: "EMERGENCY_PROCEDURES",
  },
  {
    topic: "Checklist discipline",
    keywords: ["checklist"],
    source: "Airplane Flying Handbook, Ch. 18 — Emergency Procedures",
    url: AFH_CH18_URL,
    category: "PROCEDURES",
    skill: "CHECKLIST_DISCIPLINE",
  },
  {
    topic: "Tower communications",
    keywords: ["radio", "tower", "readback", "clearance", "amended"],
    source: "Aeronautical Information Manual (AIM), Ch. 4 — Air Traffic Control",
    url: AIM_CH4_URL,
    category: "COMMUNICATIONS",
    skill: "TOWER_READBACKS",
  },
  {
    topic: "Airspeed control",
    keywords: ["speed", "airspeed", "configur"],
    source: "Pilot's Handbook of Aeronautical Knowledge (FAA-H-8083-25C), Ch. 5 — Aerodynamics of Flight",
    url: PHAK_CH5_URL,
    category: "AIRSPEED_CONTROL",
    skill: "AIRSPEED_CONTROL",
  },
  {
    topic: "Navigation",
    keywords: ["navigation", "cross country", "cross-country", "diversion"],
    source: "Pilot's Handbook of Aeronautical Knowledge, Ch. 16 — Navigation",
    url: PHAK_CH16_URL,
    category: "NAVIGATION",
    skill: "NAVIGATION",
  },
  // --- Added for the structured/guided debrief's flight-task catalog -------
  {
    topic: "Normal takeoff",
    keywords: ["normal takeoff", "takeoff", "take off", "departure climb", "rotation"],
    source: "Airplane Flying Handbook, Ch. 6 — Takeoffs and Departure Climbs",
    url: AFH_CH6_URL,
    category: "MANEUVERS",
    skill: "NORMAL_TAKEOFF",
  },
  {
    topic: "Short-field takeoffs",
    keywords: ["short field takeoff", "short-field takeoff"],
    source: "Airplane Flying Handbook, Ch. 6 — Short-Field Takeoff and Climb",
    url: AFH_CH6_URL,
    category: "MANEUVERS",
    skill: "SHORT_FIELD_TAKEOFF",
  },
  {
    topic: "Soft-field takeoffs",
    keywords: ["soft field takeoff", "soft-field takeoff"],
    source: "Airplane Flying Handbook, Ch. 6 — Soft-Field Takeoff and Climb",
    url: AFH_CH6_URL,
    category: "MANEUVERS",
    skill: "SOFT_FIELD_TAKEOFF",
  },
  {
    topic: "Crosswind takeoffs",
    keywords: ["crosswind takeoff"],
    source: "Airplane Flying Handbook, Ch. 6 — Crosswind Takeoff and Climb",
    url: AFH_CH6_URL,
    category: "MANEUVERS",
    skill: "CROSSWIND_TAKEOFF",
  },
  {
    // Kept as a generic catch-all for a debrief that just says "ground
    // reference work" without naming a specific maneuver -- the three
    // specific maneuvers below get their own skill when actually named, so
    // this entry's keywords stay narrow to avoid double-classifying the same
    // sentence under both.
    topic: "Ground reference maneuvers",
    keywords: ["ground reference maneuver", "ground reference work"],
    source: "Airplane Flying Handbook, Ch. 7 — Ground Reference Maneuvers",
    url: AFH_CH7_URL,
    category: "MANEUVERS",
    skill: "GROUND_REF_MANEUVERS",
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
    keywords: ["s-turn", "s-turns", "s turns across a road"],
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
    topic: "Radio communications",
    keywords: ["radio communication", "radio call", "frequency change", "read back", "readback"],
    source: "Aeronautical Information Manual (AIM), Ch. 4 — Air Traffic Control",
    url: AIM_CH4_URL,
    category: "COMMUNICATIONS",
    skill: "RADIO_COMMUNICATIONS",
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
    const matches = TOPIC_LIBRARY.filter((t) => t.keywords.some((k) => lower.includes(k)));
    for (const m of matches) {
      if (seen.has(m.source)) continue;
      seen.add(m.source);
      references.push({ topic: m.topic, source: m.source, url: m.url, why: sentence.trim() });
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
  return TOPIC_LIBRARY.find((t) => t.skill === skill)?.category ?? "PROCEDURES";
}

/** Human-readable label for a TrainingCategory code, e.g. "AIRSPEED_CONTROL" -> "Airspeed Control". */
const CATEGORY_LABELS: Record<TrainingCategory, string> = {
  LANDINGS: "Landings",
  MANEUVERS: "Maneuvers",
  COMMUNICATIONS: "Communications",
  PROCEDURES: "Procedures",
  AIRSPEED_CONTROL: "Airspeed Control",
  NAVIGATION: "Navigation",
  RISK_MANAGEMENT: "Risk Management & ADM",
};

export function categoryLabel(category: TrainingCategory): string {
  return CATEGORY_LABELS[category];
}
