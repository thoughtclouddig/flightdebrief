/**
 * Real, sourced third-party data -- not testimonials (none exist yet for a
 * prototype). Every figure here traces to a specific published source; if a
 * stat's source ever goes stale or is removed, pull the stat too.
 */
export interface SocialProofStat {
  value: string;
  label: string;
  sourceLabel: string;
  sourceUrl: string;
}

export const SOCIAL_PROOF_STATS: SocialProofStat[] = [
  {
    value: "80%",
    label: "of student pilots quit before earning a private pilot certificate",
    sourceLabel: "AOPA / SAFE, via PilotBound",
    sourceUrl: "https://pilotbound.app/data/student-pilot-dropout-rate",
  },
  {
    value: "<12 mo",
    label: "average CFI tenure at many flight schools before moving on",
    sourceLabel: "Plane & Pilot Magazine",
    sourceUrl: "https://planeandpilotmag.com/how-temporary-are-cfis/",
  },
];

export const SOCIAL_PROOF_QUOTE = {
  text: "The best time to learn may be in the few moments right after a flight, in an organized and controlled manner.",
  sourceLabel: "Aviation Safety Magazine, on post-flight debriefing",
  sourceUrl: "https://aviationsafetymagazine.com/features/post-flight-debrief/",
};
