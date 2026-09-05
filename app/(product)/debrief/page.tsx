import { StudentDebriefHub } from "@/components/student/debrief/student-debrief-hub";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { buildProductionDebriefHubProps } from "@/lib/student/debrief-hub-production-adapter";

export const dynamic = "force-dynamic";

/**
 * Real Debrief hub -- wired to the approved V2 presentation
 * (components/student/debrief/student-debrief-hub.tsx) via
 * lib/student/debrief-hub-production-adapter.ts, shared verbatim with
 * app/v2/debrief/page.tsx's own real-data branch.
 */
export default async function DebriefHub() {
  const repo = getRepository();
  const viewer = await getViewer();
  const props = await buildProductionDebriefHubProps(repo, viewer, {
    debriefResultsHref: (flightId) => `/flights/${flightId}/debrief/results`,
    newDebriefHref: "/debrief/new",
    startDebriefHref: (flightId) => `/flights/${flightId}/debrief`,
  });

  return <StudentDebriefHub {...props} />;
}
