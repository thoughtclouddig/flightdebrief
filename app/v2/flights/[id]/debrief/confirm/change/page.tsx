import { notFound, redirect } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { BackLink, PageTitle, QuietRow, Screen } from "@/components/student/ui";
import { formatFlightDate } from "@/lib/utils";

/**
 * Real "Change" destination for the lesson-confirmation screen, under /v2
 * -- same real eligible-flights logic as app/(product)/flights/[id]/debrief/
 * confirm/change/page.tsx, hrefs repointed at /v2/**. Closes the D-classified
 * "Change objectives" gap from the routing audit, including its own
 * stranding consequence (this page's Back link and per-flight rows now stay
 * under /v2 too, instead of leaving the student in canonical for the rest
 * of that flight's debrief). Add Flight is disabled everywhere in real-data
 * /v2 (see app/v2/flights/page.tsx's own doc comment), so the empty-state
 * offer to add a flight is plain text here rather than a dead link.
 */
export default async function V2ChangeDebriefFlightPage(props: PageProps<"/v2/flights/[id]/debrief/confirm/change">) {
  const { id } = await props.params;
  let authorized;
  try {
    authorized = await getAuthorizedFlight(id);
  } catch {
    redirect(`/login?from=%2Fv2%2Fflights%2F${id}%2Fdebrief%2Fconfirm%2Fchange&reason=no-session`);
  }
  if (!authorized) notFound();
  const { viewer, flight } = authorized;
  if (viewer.role !== "student" || viewer.user.id !== flight.userId) notFound();

  const repo = getRepository();
  const flights = await repo.listFlights({ studentId: viewer.user.id });
  const eligible = flights
    .filter((f) => f.id !== id && f.debriefStatus !== "complete")
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate));

  return (
    <Screen>
      <BackLink href={`/v2/flights/${id}/debrief/confirm`}>Back</BackLink>
      <PageTitle kicker="Debrief a different flight">Which flight?</PageTitle>

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
          No other flights are waiting to be debriefed right now.
        </p>
      )}
    </Screen>
  );
}
