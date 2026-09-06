/**
 * The one place that knows the shape of the approved Mia fixture demo's
 * internal route graph. Both app/v2/**'s fixture branches and
 * app/demo/student/** render from this -- the same Mia components, the same
 * Mia data, the same interactions, just with every href built from a
 * different base path. Nothing here depends on which base is passed in;
 * "/v2" and "/demo/student" produce structurally identical maps.
 *
 * This exists specifically so the two trees cannot drift the way
 * app/prototype/vector/** drifted from app/v2/** -- see
 * fixture-student-hrefs.test.ts for the automated checks that lean on it.
 */
export interface FixtureStudentHrefs {
  home: string;
  flights: string;
  flightsNew: string;
  flightDetail: (flightId: string) => string;
  flightAnalysis: (flightId: string) => string;
  flightCompare: (flightId: string) => string;
  flightReplay: (flightId: string, atSeconds?: number) => string;
  flightMoment: (flightId: string, momentId: string) => string;
  flightMomentsBase: (flightId: string) => string;
  fly: string;
  train: string;
  chairFly: string;
  debriefHub: string;
  debriefNew: string;
  debriefLatest: string;
  progress: string;
  skill: (slug: string) => string;
  profile: string;
  profileGuide: string;
  profileSupport: string;
}

export function buildFixtureStudentHrefs(base: string): FixtureStudentHrefs {
  return {
    home: base,
    flights: `${base}/flights`,
    flightsNew: `${base}/flights/new`,
    flightDetail: (flightId) => `${base}/flights/${flightId}`,
    flightAnalysis: (flightId) => `${base}/flights/${flightId}/analysis`,
    flightCompare: (flightId) => `${base}/flights/${flightId}/compare`,
    flightReplay: (flightId, atSeconds) => `${base}/flights/${flightId}/replay${atSeconds !== undefined ? `?t=${atSeconds}` : ""}`,
    flightMoment: (flightId, momentId) => `${base}/flights/${flightId}/moments/${momentId}`,
    flightMomentsBase: (flightId) => `${base}/flights/${flightId}/moments`,
    fly: `${base}/fly`,
    train: `${base}/train`,
    chairFly: `${base}/train/chair-fly`,
    debriefHub: `${base}/debrief`,
    debriefNew: `${base}/debrief/new`,
    debriefLatest: `${base}/debrief/latest`,
    progress: `${base}/progress`,
    skill: (slug) => `${base}/progress/${slug}`,
    profile: `${base}/profile`,
    profileGuide: `${base}/profile/guide`,
    profileSupport: `${base}/profile/support`,
  };
}
