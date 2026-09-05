import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FlightsList, type FlightListRow } from "@/components/student/flights/flights-list";
import { FLIGHTS, TRACKED_HOURS_DISCLAIMER, formatHours, statusLabel, trackedHours } from "@/lib/prototype-fixtures/flights";
import { v2RealDataMode } from "@/lib/env";
import { hasV2RealDataCookie } from "@/lib/auth/session";
import { getViewer } from "@/lib/viewer";
import { getRepository } from "@/lib/data";
import { buildProductionFlightsListProps } from "@/lib/student/flights-list-production-adapter";

export const metadata: Metadata = { title: "My flights — AfterFlight", robots: { index: false, follow: false } };

/**
 * Milestone 1B fixture-parity Flights list -- mechanically the same as
 * app/prototype/vector/flights/page.tsx, hrefs repointed at /v2/**.
 *
 * Development real-data milestone: reuses the same adapter built for
 * app/(product)/dashboard/page.tsx, hrefs repointed at /v2/flights/[id].
 * Add Flight still points at the canonical /flights/new -- out of scope for
 * this milestone's "wire these first" list.
 */
export default async function V2MyFlights() {
  if (v2RealDataMode(await hasV2RealDataCookie())) {
    let viewer;
    try {
      viewer = await getViewer();
    } catch {
      redirect("/login?from=%2Fv2%2Fflights&reason=no-session");
    }
    const props = await buildProductionFlightsListProps(getRepository(), viewer.user.id, {
      backHref: "/v2/profile",
      addFlightHref: "/flights/new",
      flightHref: (flightId) => `/v2/flights/${flightId}`,
    });
    return <FlightsList {...props} />;
  }

  const flights: FlightListRow[] = FLIGHTS.map((f) => ({
    id: f.id,
    href: `/v2/flights/${f.id}`,
    lesson: f.lesson,
    dateLabel: f.dateLabel,
    departureAirport: f.departureAirport,
    arrivalAirport: f.arrivalAirport,
    durationLabel: formatHours(f.durationMinutes),
    aircraftType: f.aircraftType,
    tailNumber: f.tailNumber,
    instructorName: f.instructor,
    statusLabel: statusLabel(f.status),
    needsAction: f.status === "NEEDS_DEBRIEF" || f.status === "DEBRIEF_STARTED",
    hasTrack: Boolean(f.track),
  }));

  return (
    <FlightsList
      backHref="/v2/profile"
      addFlightHref="/v2/flights/new"
      trackedHoursLabel={trackedHours()}
      trackedHoursDisclaimer={TRACKED_HOURS_DISCLAIMER}
      flights={flights}
    />
  );
}
