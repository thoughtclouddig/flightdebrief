import { notFound } from "next/navigation";
import Link from "next/link";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { BackLink, PageTitle, QuietRow, Screen } from "@/components/prototype/ui";
import { formatFlightDate } from "@/lib/utils";

/**
 * Real "Change" destination for the lesson-confirmation screen -- the
 * student's other eligible flights (not yet debriefed, excluding the one
 * they're currently confirming), not a fake fixture list. Most students only
 * ever have one eligible flight at a time, so this is usually a short or
 * empty list; that's the honest current state, not a bug.
 */
export default async function ChangeDebriefFlightPage(props: PageProps<"/flights/[id]/debrief/confirm/change">) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();
  const { viewer, flight } = authorized;
  if (viewer.user.id !== flight.userId) notFound();

  const repo = getRepository();
  const flights = await repo.listFlights({ studentId: viewer.user.id });
  const eligible = flights
    .filter((f) => f.id !== id && f.debriefStatus !== "complete")
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate));

  return (
    <Screen>
      <BackLink href={`/flights/${id}/debrief/confirm`}>Back</BackLink>
      <PageTitle kicker="Debrief a different flight">Which flight?</PageTitle>

      {eligible.length > 0 ? (
        <div className="flex flex-col">
          {eligible.map((f) => (
            <QuietRow
              key={f.id}
              href={`/flights/${f.id}/debrief/confirm`}
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
          No other flights are waiting to be debriefed right now.{" "}
          <Link href="/flights/new" className="font-medium text-brand">
            Add a flight
          </Link>{" "}
          if one is missing.
        </p>
      )}
    </Screen>
  );
}
