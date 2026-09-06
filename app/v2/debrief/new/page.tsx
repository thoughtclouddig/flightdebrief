import { redirect } from "next/navigation";
import { GuidedDebriefDemo } from "@/components/student/debrief/guided-debrief-demo";
import { BackLink, PageTitle, QuietRow, Screen } from "@/components/student/ui";
import { formatFlightDate } from "@/lib/utils";
import { v2RealDataMode } from "@/lib/env";
import { hasV2RealDataCookie } from "@/lib/auth/session";
import { getViewer } from "@/lib/viewer";
import { getRepository } from "@/lib/data";
import { listEligibleFlightsForNewDebrief } from "@/lib/student/debrief-hub-production-adapter";

/**
 * Milestone 1B fixture-parity guided debrief -- mechanically the same as app/prototype/vector/debrief/new/page.tsx, hrefs repointed at /v2/**.
 *
 * Real-data branch: same real eligible-flights query as app/(product)/
 * debrief/new/page.tsx (lib/student/debrief-hub-production-adapter.ts),
 * same V2 primitives that page already used, hrefs repointed at /v2/**.
 * Closes the D-classified "Start new debrief" gap from the routing audit.
 * Add Flight is disabled everywhere in real-data /v2 (see app/v2/flights/
 * page.tsx's own doc comment), so the empty-state offer to add a flight is
 * plain text here rather than a dead link.
 */
export default async function V2NewDebrief() {
  if (v2RealDataMode(await hasV2RealDataCookie())) {
    let viewer;
    try {
      viewer = await getViewer();
    } catch {
      redirect("/login?from=%2Fv2%2Fdebrief%2Fnew&reason=no-session");
    }
    const eligible = await listEligibleFlightsForNewDebrief(getRepository(), viewer.user.id);

    if (eligible.length === 1) {
      redirect(`/v2/flights/${eligible[0]!.id}/debrief/confirm`);
    }

    return (
      <Screen>
        <BackLink href="/v2/debrief">Debriefs</BackLink>
        <PageTitle kicker="Start a debrief">Which flight?</PageTitle>

        {eligible.length > 0 ? (
          <div className="flex flex-col">
            {eligible.map((f) => (
              <QuietRow
                key={f.id}
                href={`/v2/flights/${f.id}/debrief/confirm`}
                label={
                  <>
                    <span className="block font-medium">
                      {f.departureAirport} &rarr; {f.arrivalAirport}
                    </span>
                    <span className="block text-[15px] text-foreground-faint">{formatFlightDate(f.flightDate)}</span>
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <p className="px-1.5 text-[15px] leading-relaxed text-foreground-faint">
            No flights are waiting to be debriefed right now.
          </p>
        )}
      </Screen>
    );
  }

  return <GuidedDebriefDemo hubHref="/v2/debrief" addFlightHref="/v2/flights/new" resultHref="/v2/debrief/latest" />;
}
