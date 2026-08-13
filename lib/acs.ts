import type { CertificateType, TrainingSkill } from "@/lib/types";

export interface AcsArea {
  name: string;
  url: string;
}

/**
 * Direct link to the Private Pilot -- Airplane Category ACS PDF
 * (FAA-S-ACS-6, currently revision C). Confirmed from the live FAA ACS list
 * (https://www.faa.gov/training_testing/testing/acs) -- the filename doesn't
 * include the revision letter, so FAA replaces the file in place on
 * revisions rather than renaming it, making this safe to link directly
 * rather than to the generic all-ACS index.
 */
const PRIVATE_ACS_PDF_URL = "https://www.faa.gov/training_testing/testing/acs/private_airplane_acs_6.pdf";

/**
 * Private Pilot -- Airplane ACS Areas of Operation, at the Area level only
 * (no Task/Element codes -- see lib/acs.ts's caller for why). Skills that
 * are cross-cutting rather than a single standalone Area (checklist use,
 * radio communications, airspeed control) are intentionally left unmapped.
 */
const PRIVATE_ACS_AREAS: Partial<Record<TrainingSkill, AcsArea>> = {
  TRAFFIC_PATTERN: { name: "Takeoffs, Landings, and Go-Arounds", url: PRIVATE_ACS_PDF_URL },
  STABILIZED_APPROACH: { name: "Takeoffs, Landings, and Go-Arounds", url: PRIVATE_ACS_PDF_URL },
  GO_AROUND: { name: "Takeoffs, Landings, and Go-Arounds", url: PRIVATE_ACS_PDF_URL },
  SHORT_FIELD_LANDING: { name: "Takeoffs, Landings, and Go-Arounds", url: PRIVATE_ACS_PDF_URL },
  CROSSWIND_LANDING: { name: "Takeoffs, Landings, and Go-Arounds", url: PRIVATE_ACS_PDF_URL },
  STEEP_TURNS: { name: "Performance Maneuvers", url: PRIVATE_ACS_PDF_URL },
  SLOW_FLIGHT: { name: "Slow Flight and Stalls", url: PRIVATE_ACS_PDF_URL },
  STALLS: { name: "Slow Flight and Stalls", url: PRIVATE_ACS_PDF_URL },
  EMERGENCY_PROCEDURES: { name: "Emergency Operations", url: PRIVATE_ACS_PDF_URL },
  NAVIGATION: { name: "Navigation", url: PRIVATE_ACS_PDF_URL },
};

export function acsAreaForSkill(skill: TrainingSkill, certificateType: CertificateType | null): AcsArea | null {
  if (certificateType !== "PRIVATE") return null;
  return PRIVATE_ACS_AREAS[skill] ?? null;
}
