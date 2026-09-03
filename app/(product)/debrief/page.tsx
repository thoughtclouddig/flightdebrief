import { Mic } from "lucide-react";
import { Panel, PanelButton, PanelEyebrow, PanelHeadline, PanelMeta, PageTitle, QuietRow, Screen, Section } from "@/components/prototype/ui";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { formatFlightContext } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * The Debrief tab's destination -- a place to START a debrief, not only to
 * read one (app/prototype/vector/debrief/page.tsx is the design source).
 * Real data only: the "just landed" panel links to the actual most-recent
 * undebriefed flight's real recording route
 * (/flights/[id]/debrief -- unchanged, V1, see the Phase 4 report for why
 * that flow's own internals weren't rewritten this pass) rather than a
 * fixture "/debrief/new" destination that doesn't exist in production.
 * Latest/Earlier read the same repo.listFlights() data Home and My Flights
 * already use.
 */
export default async function DebriefHub() {
  const repo = getRepository();
  const viewer = await getViewer();
  const flights = await repo.listFlights({ studentId: viewer.user.id });

  const pendingFlight = [...flights]
    .filter((f) => f.debriefStatus !== "complete")
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate))[0] ?? null;

  const debriefed = flights
    .filter((f) => f.debriefStatus === "complete")
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate));
  const [latest, ...history] = debriefed;

  return (
    <Screen>
      <PageTitle>Debriefs</PageTitle>

      {pendingFlight ? (
        <Panel>
          <PanelEyebrow icon={<Mic className="size-3.5" aria-hidden />}>Just landed?</PanelEyebrow>
          <PanelHeadline>Capture it while it&rsquo;s fresh</PanelHeadline>
          <PanelMeta>{formatFlightContext(pendingFlight)}</PanelMeta>
          <p className="mt-3 text-[15px] leading-relaxed text-panel-foreground-soft">
            Hand your instructor the phone, or record the conversation together. About ninety seconds.
          </p>
          <div className="mt-5">
            <PanelButton href={`/flights/${pendingFlight.id}/debrief`}>Start new debrief</PanelButton>
          </div>
        </Panel>
      ) : null}

      {latest ? (
        <Section title="Latest">
          <div className="flex flex-col">
            <QuietRow
              href={`/flights/${latest.id}/debrief/results`}
              label={
                <>
                  <span className="block font-medium">{latest.departureAirport} → {latest.arrivalAirport}</span>
                  <span className="block text-[15px] text-foreground-faint">
                    {new Date(latest.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
                    {latest.aircraft.tailNumber}
                  </span>
                </>
              }
            />
          </div>
        </Section>
      ) : null}

      {history.length > 0 ? (
        <Section title="Earlier">
          <div className="flex flex-col">
            {history.map((flight) => (
              <QuietRow
                key={flight.id}
                href={`/flights/${flight.id}/debrief/results`}
                label={
                  <>
                    <span className="block font-medium">{flight.departureAirport} → {flight.arrivalAirport}</span>
                    <span className="block text-[15px] text-foreground-faint">
                      {new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
                      {flight.aircraft.tailNumber}
                    </span>
                  </>
                }
              />
            ))}
          </div>
        </Section>
      ) : null}

      {!pendingFlight && !latest ? (
        <p className="px-1.5 text-[15px] text-foreground-faint">No flights yet -- your debriefs will show up here.</p>
      ) : null}
    </Screen>
  );
}
