import type { CertificateType, TrainingSkill } from "@/lib/types";

export interface AcsArea {
  name: string;
  url: string;
}

/**
 * FAA's ACS index (not a specific PDF filename) -- ACS documents carry
 * revision letters (e.g. FAA-S-ACS-6C) that go stale, so we link to the
 * stable landing page rather than a version we'd have to keep updated.
 */
const ACS_INDEX_URL = "https://www.faa.gov/training_testing/testing/acs";

/**
 * Private Pilot -- Airplane ACS Areas of Operation, at the Area level only
 * (no Task/Element codes -- see lib/acs.ts's caller for why). Skills that
 * are cross-cutting rather than a single standalone Area (checklist use,
 * radio communications, airspeed control) are intentionally left unmapped.
 */
const PRIVATE_ACS_AREAS: Partial<Record<TrainingSkill, AcsArea>> = {
  TRAFFIC_PATTERN: { name: "Takeoffs, Landings, and Go-Arounds", url: ACS_INDEX_URL },
  STABILIZED_APPROACH: { name: "Takeoffs, Landings, and Go-Arounds", url: ACS_INDEX_URL },
  GO_AROUND: { name: "Takeoffs, Landings, and Go-Arounds", url: ACS_INDEX_URL },
  SHORT_FIELD_LANDING: { name: "Takeoffs, Landings, and Go-Arounds", url: ACS_INDEX_URL },
  CROSSWIND_LANDING: { name: "Takeoffs, Landings, and Go-Arounds", url: ACS_INDEX_URL },
  STEEP_TURNS: { name: "Performance Maneuvers", url: ACS_INDEX_URL },
  SLOW_FLIGHT: { name: "Slow Flight and Stalls", url: ACS_INDEX_URL },
  STALLS: { name: "Slow Flight and Stalls", url: ACS_INDEX_URL },
  EMERGENCY_PROCEDURES: { name: "Emergency Operations", url: ACS_INDEX_URL },
  NAVIGATION: { name: "Navigation", url: ACS_INDEX_URL },
};

export function acsAreaForSkill(skill: TrainingSkill, certificateType: CertificateType | null): AcsArea | null {
  if (certificateType !== "PRIVATE") return null;
  return PRIVATE_ACS_AREAS[skill] ?? null;
}
