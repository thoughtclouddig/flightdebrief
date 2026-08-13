import type { TrainingCategory, TrainingSkill } from "@/lib/types";

export interface StudyReference {
  topic: string;
  source: string;
  url: string;
}

const AFH_URL = "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/airplane_handbook";
const PHAK_URL = "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak";
const AIM_URL = "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aim";

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
    source: "Airplane Flying Handbook (FAA-H-8083-3), Ch. 7 — Traffic Patterns",
    url: AFH_URL,
    category: "MANEUVERS",
    skill: "TRAFFIC_PATTERN",
  },
  {
    topic: "Landings",
    keywords: ["landing", "landings", "touch and go", "touch-and-go", "float", "floated", "flare"],
    source: "Airplane Flying Handbook, Ch. 8 — Approaches and Landings",
    url: AFH_URL,
    category: "LANDINGS",
    skill: "STABILIZED_APPROACH",
  },
  {
    topic: "Go-around",
    keywords: ["go-around", "go around"],
    source: "Airplane Flying Handbook, Ch. 8 — Go-Arounds",
    url: AFH_URL,
    category: "LANDINGS",
    skill: "GO_AROUND",
  },
  {
    topic: "Short-field landings",
    keywords: ["short field", "short-field"],
    source: "Airplane Flying Handbook, Ch. 8 — Short-Field Approach and Landing",
    url: AFH_URL,
    category: "LANDINGS",
    skill: "SHORT_FIELD_LANDING",
  },
  {
    topic: "Crosswind landings",
    keywords: ["crosswind"],
    source: "Airplane Flying Handbook, Ch. 8 — Crosswind Approach and Landing",
    url: AFH_URL,
    category: "LANDINGS",
    skill: "CROSSWIND_LANDING",
  },
  {
    topic: "Steep turns",
    keywords: ["steep turn"],
    source: "Airplane Flying Handbook, Ch. 10 — Performance Maneuvers",
    url: AFH_URL,
    category: "MANEUVERS",
    skill: "STEEP_TURNS",
  },
  {
    topic: "Slow flight",
    keywords: ["slow flight"],
    source: "Airplane Flying Handbook, Ch. 4 — Slow Flight",
    url: AFH_URL,
    category: "MANEUVERS",
    skill: "SLOW_FLIGHT",
  },
  {
    topic: "Stalls",
    keywords: ["stall"],
    source: "Airplane Flying Handbook, Ch. 4 — Stalls",
    url: AFH_URL,
    category: "MANEUVERS",
    skill: "STALLS",
  },
  {
    topic: "Emergency procedures",
    keywords: ["emergency", "engine-out", "engine out", "forced landing"],
    source: "Airplane Flying Handbook, Ch. 17 — Emergency Procedures",
    url: AFH_URL,
    category: "PROCEDURES",
    skill: "EMERGENCY_PROCEDURES",
  },
  {
    topic: "Checklist discipline",
    keywords: ["checklist"],
    source: "Airplane Flying Handbook, Ch. 17 — Emergency Procedures",
    url: AFH_URL,
    category: "PROCEDURES",
    skill: "CHECKLIST_DISCIPLINE",
  },
  {
    topic: "Tower communications",
    keywords: ["radio", "tower", "readback", "clearance", "amended"],
    source: "Aeronautical Information Manual (AIM), Ch. 4 — Air Traffic Control",
    url: AIM_URL,
    category: "COMMUNICATIONS",
    skill: "TOWER_READBACKS",
  },
  {
    topic: "Airspeed control",
    keywords: ["speed", "airspeed", "configur"],
    source: "Pilot's Handbook of Aeronautical Knowledge (FAA-H-8083-25), Ch. 5 — Aerodynamics of Flight",
    url: PHAK_URL,
    category: "AIRSPEED_CONTROL",
    skill: "AIRSPEED_CONTROL",
  },
  {
    topic: "Navigation",
    keywords: ["navigation", "cross country", "cross-country", "diversion"],
    source: "Pilot's Handbook of Aeronautical Knowledge, Ch. 16 — Navigation",
    url: PHAK_URL,
    category: "NAVIGATION",
    skill: "NAVIGATION",
  },
];

export function detectTopics(text: string): string[] {
  const lower = text.toLowerCase();
  const found = TOPIC_LIBRARY.filter((t) => t.keywords.some((k) => lower.includes(k))).map((t) => t.topic);
  return found.length ? found : ["General flight training"];
}

/** Given weak-area text (needsWork + actionItems), suggest FAA reference material to study. */
export function suggestStudyReferences(weakAreaText: string): StudyReference[] {
  const lower = weakAreaText.toLowerCase();
  const matches = TOPIC_LIBRARY.filter((t) => t.keywords.some((k) => lower.includes(k)));
  const seen = new Set<string>();
  const references: StudyReference[] = [];
  for (const m of matches) {
    if (seen.has(m.source)) continue;
    seen.add(m.source);
    references.push({ topic: m.topic, source: m.source, url: m.url });
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

/** Human-readable label for a normalized skill code, e.g. "STABILIZED_APPROACH" -> "Landings". */
export function skillLabel(skill: TrainingSkill): string {
  return TOPIC_LIBRARY.find((t) => t.skill === skill)?.topic ?? skill;
}
