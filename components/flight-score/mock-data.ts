import type { FlightScoreData } from "./types";

/**
 * Fixtures for demo/testing use only -- never presented as a real student's
 * score anywhere in the app (see app/(product)/progress/page.tsx, which
 * shows FlightScoreGauge in an explicit "not available yet" state instead of
 * these). Real scoring methodology doesn't exist yet -- see the debrief
 * redesign plan's FlightScore section for why.
 */
export const mockFlightScoreOnTrack: FlightScoreData = {
  score: 82,
  label: "Progressing",
  tone: "good",
  categories: [
    { label: "Aircraft Control", score: 85, tone: "good" },
    { label: "Procedures", score: 80, tone: "good" },
    { label: "Navigation", score: 78, tone: "amber" },
    { label: "Communication", score: 90, tone: "good" },
    { label: "Decision Making", score: 76, tone: "amber" },
  ],
};

export const mockFlightScoreDeveloping: FlightScoreData = {
  score: 62,
  label: "Developing",
  tone: "amber",
  categories: [
    { label: "Aircraft Control", score: 62, tone: "amber" },
    { label: "Procedures", score: 55, tone: "amber" },
    { label: "Navigation", score: 60, tone: "amber" },
    { label: "Communication", score: 70, tone: "good" },
    { label: "Decision Making", score: 45, tone: "danger" },
  ],
};

export const mockFlightScoreNeedsAttention: FlightScoreData = {
  score: 34,
  label: "Needs Focus",
  tone: "danger",
  categories: [
    { label: "Aircraft Control", score: 40, tone: "danger" },
    { label: "Procedures", score: 30, tone: "danger" },
    { label: "Navigation", score: 38, tone: "danger" },
    { label: "Communication", score: 55, tone: "amber" },
    { label: "Decision Making", score: 25, tone: "danger" },
  ],
};
