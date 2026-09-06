import { redirect } from "next/navigation";
import Link from "next/link";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { BackLink, PageTitle, QuietRow, Screen } from "@/components/student/ui";
import { formatFlightDate } from "@/lib/utils";
import { listEligibleFlightsForNewDebrief } from "@/lib/student/debrief-hub-production-adapter";

export const dynamic = "force-dynamic";

/**
 * The real destination for the Debrief hub's "Start new debrief" when the
 * hub couldn't auto-select a single pending flight -- the primary action
 * stays visible either way (see app/(product)/debrief/page.tsx); this is
 * what it leads to instead of disappearing. Real eligible-flights query
 * (lib/student/debrief-hub-production-adapter.ts, shared with app/v2/
 * debrief/new/page.tsx's own real-data branch), not a fixture: if exactly
 * one flight qualifies, skip straight to confirming it; if several do, let
 * the student pick; if none do, say so honestly and offer to add one.
 */
export default async function StartDebriefPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const eligible = await listEligibleFlightsForNewDebrief(repo, viewer.user.id);

  if (eligible.length === 1) {
    redirect(`/flights/${eligible[0]!.id}/debrief/confirm`);
  }

  return (
    <Screen>
      <BackLink href="/debrief">Debriefs</BackLink>
      <PageTitle kicker="Start a debrief">Which flight?</PageTitle>

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
          No flights are waiting to be debriefed right now.{" "}
          <Link href="/flights/new" className="font-medium text-brand">
            Add a flight
          </Link>{" "}
          to start one.
        </p>
      )}
    </Screen>
  );
}
