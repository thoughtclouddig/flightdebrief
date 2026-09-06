import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StudentDebriefHub, type StudentDebriefRow } from "@/components/student/debrief/student-debrief-hub";
import { DEBRIEFS } from "@/lib/prototype-fixtures/vector-data";
import { v2RealDataMode } from "@/lib/env";
import { hasV2RealDataCookie } from "@/lib/auth/session";
import { getViewer } from "@/lib/viewer";
import { getRepository } from "@/lib/data";
import { buildProductionDebriefHubProps } from "@/lib/student/debrief-hub-production-adapter";

export const metadata: Metadata = { title: "Debriefs — AfterFlight", robots: { index: false, follow: false } };

/**
 * Milestone 1B fixture-parity Debrief hub -- mechanically the same as
 * app/prototype/vector/debrief/page.tsx. /debrief/new and /debrief/latest
 * now exist under /v2, so both are real, live destinations.
 *
 * Development real-data milestone: same adapter
 * app/(product)/debrief/page.tsx uses. "Start new debrief" when no single
 * pending flight can be auto-selected now points at the real /v2/debrief/new
 * (app/v2/debrief/new/page.tsx's own real-data branch), not canonical.
 */
export default async function V2DebriefHub() {
  if (v2RealDataMode(await hasV2RealDataCookie())) {
    let viewer;
    try {
      viewer = await getViewer();
    } catch {
      redirect("/login?from=%2Fv2%2Fdebrief&reason=no-session");
    }
    const props = await buildProductionDebriefHubProps(getRepository(), viewer, {
      debriefResultsHref: (flightId) => `/v2/flights/${flightId}/debrief/results`,
      newDebriefHref: "/v2/debrief/new",
      startDebriefHref: (flightId) => `/v2/flights/${flightId}/debrief`,
    });
    return <StudentDebriefHub {...props} />;
  }

  const [latest, ...history] = DEBRIEFS.map(
    (d): StudentDebriefRow => ({
      id: d.id,
      href: "/v2/debrief/latest",
      label: d.lesson,
      dateLabel: d.date,
      instructorLabel: d.instructor,
      durationLabel: d.length,
    }),
  );

  return <StudentDebriefHub justLandedHref="/v2/debrief/new" latest={latest ?? null} history={history} />;
}
