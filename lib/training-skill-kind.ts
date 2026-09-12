import type { TrainingSkill } from "@/lib/types";

/**
 * What kind of learning applies to a TrainingSkill -- lives here, separate
 * from lib/topics.ts's TOPIC_LIBRARY, on purpose: TOPIC_LIBRARY describes
 * which trusted RESOURCE grounds a topic (a citation), this module
 * describes the SKILL itself (what kind of preparation is honest to offer
 * for it). Mixing the two would mean every citation entry also has to carry
 * a training-characteristics opinion that has nothing to do with sourcing.
 *
 * Deliberately a single boolean for V1, not the full knowledge/procedure/
 * communication/physical/decision-making taxonomy -- only enough
 * classification exists to stop Vector's coaching from ever implying it can
 * teach stick-and-rudder aircraft control on the ground. A physical skill
 * still gets full Vector coaching (evidence + curated preparation points +
 * citation); this flag only changes the coaching's framing sentence, so it
 * never reads as "Vector can teach you to land."
 *
 * Extends cleanly later: PHYSICAL_SKILLS could become a
 * `Record<TrainingSkill, LearningKind>` without changing any caller's shape
 * beyond `isPhysicalSkill(skill)` becoming `skillKind(skill) === "physical"`
 * -- the Vector router already keys off a skill code, not this file's
 * internal representation of it.
 */
const PHYSICAL_SKILLS: ReadonlySet<TrainingSkill> = new Set<TrainingSkill>([
  "STABILIZED_APPROACH",
  "SHORT_FIELD_LANDING",
  "CROSSWIND_LANDING",
  "SOFT_FIELD_LANDING",
  "GO_AROUND",
  "STEEP_TURNS",
  "SLOW_FLIGHT",
  "STALLS",
  "POWER_OFF_STALLS",
  "POWER_ON_STALLS",
  "ACCELERATED_STALLS",
  "SPIN_AWARENESS",
  "NORMAL_TAKEOFF",
  "SOFT_FIELD_TAKEOFF",
  "SHORT_FIELD_TAKEOFF",
  "CROSSWIND_TAKEOFF",
  "GROUND_REF_MANEUVERS",
  "RECTANGULAR_COURSE",
  "S_TURNS",
  "TURNS_AROUND_POINT",
  "FORWARD_SLIP",
  "UNUSUAL_ATTITUDES",
  "INST_STRAIGHT_LEVEL",
  "INST_CLIMBS_DESCENTS",
  "INST_TURNS",
]);

export function isPhysicalSkill(skill: TrainingSkill): boolean {
  return PHYSICAL_SKILLS.has(skill);
}
