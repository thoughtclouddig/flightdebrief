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
 * `#page=N` targets the PDF's own 1-based page index (widely supported PDF
 * open-parameter convention -- Chrome, Firefox, Edge, and Acrobat all honor
 * it; Safari falls back to page 1 gracefully, same as today's un-anchored
 * link). Page numbers below were read directly out of FAA-S-ACS-6C
 * (November 2023) -- the document's own printed page numbers run 8 behind
 * the PDF's actual page index (printed page ii = index 1's cover, TOC ends
 * on printed page vii/PDF index 8, and the Introduction starts printed page
 * 1/PDF index 9), so `pdfPage = printedPage + 8` throughout. Re-verify this
 * offset against the live PDF if the FAA ever ships a revision D with a
 * different front-matter length.
 */
function acsPdfUrl(pdfPage: number): string {
  return `${PRIVATE_ACS_PDF_URL}#page=${pdfPage}`;
}

/**
 * Private Pilot -- Airplane ACS Areas of Operation, at the Area/Task level
 * (see lib/acs.ts's caller for why not down to individual Elements). Skills
 * that are cross-cutting rather than a single standalone Area (checklist
 * use, radio communications, airspeed control) are intentionally left
 * unmapped.
 */
const PRIVATE_ACS_AREAS: Partial<Record<TrainingSkill, AcsArea>> = {
  // Area III, Task B "Traffic Patterns" (printed p.16) -- distinct from Area
  // IV below in the ACS itself, even though this app treats pattern work as
  // part of the same landing-skills family in its own taxonomy.
  TRAFFIC_PATTERN: { name: "Traffic Patterns", url: acsPdfUrl(24) },
  // Area IV, Task B "Normal Approach and Landing" (printed p.19).
  STABILIZED_APPROACH: { name: "Takeoffs, Landings, and Go-Arounds", url: acsPdfUrl(27) },
  // Area IV, Task N "Go-Around/Rejected Landing" (printed p.34).
  GO_AROUND: { name: "Takeoffs, Landings, and Go-Arounds", url: acsPdfUrl(42) },
  // Area IV, Task F "Short-Field Approach and Landing" (printed p.24).
  SHORT_FIELD_LANDING: { name: "Takeoffs, Landings, and Go-Arounds", url: acsPdfUrl(32) },
  // No standalone crosswind task -- crosswind technique is an element within
  // Normal Approach and Landing (printed p.19), same task as STABILIZED_APPROACH.
  CROSSWIND_LANDING: { name: "Takeoffs, Landings, and Go-Arounds", url: acsPdfUrl(27) },
  // Area V, Task A "Steep Turns" (printed p.36).
  STEEP_TURNS: { name: "Performance Maneuvers", url: acsPdfUrl(44) },
  // Area VII, Task A "Maneuvering During Slow Flight" (printed p.42).
  SLOW_FLIGHT: { name: "Slow Flight and Stalls", url: acsPdfUrl(50) },
  // Area VII, Task B "Power-Off Stalls" (printed p.42, same spread as Task A above).
  STALLS: { name: "Slow Flight and Stalls", url: acsPdfUrl(50) },
  // Area IX, Task A "Emergency Descent" (printed p.51).
  EMERGENCY_PROCEDURES: { name: "Emergency Operations", url: acsPdfUrl(59) },
  // Area VI, Task A "Pilotage and Dead Reckoning" (printed p.38).
  NAVIGATION: { name: "Navigation", url: acsPdfUrl(46) },
  // Area IV, Task A "Normal Takeoff and Climb" (printed p.18).
  NORMAL_TAKEOFF: { name: "Takeoffs, Landings, and Go-Arounds", url: acsPdfUrl(26) },
  // Area V, Task B "Ground Reference Maneuvers" (printed p.36, same spread as Steep Turns).
  GROUND_REF_MANEUVERS: { name: "Ground Reference Maneuvers", url: acsPdfUrl(44) },
  // RADIO_COMMUNICATIONS, SITUATIONAL_AWARENESS, and RISK_MANAGEMENT are left
  // unmapped, same as CHECKLIST_DISCIPLINE/TOWER_READBACKS/AIRSPEED_CONTROL
  // above -- risk management and situational awareness are Special Emphasis
  // Areas the ACS weaves through every task, not a single standalone Area.
};

export function acsAreaForSkill(skill: TrainingSkill, certificateType: CertificateType | null): AcsArea | null {
  if (certificateType !== "PRIVATE") return null;
  return PRIVATE_ACS_AREAS[skill] ?? null;
}
