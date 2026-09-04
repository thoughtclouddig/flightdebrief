import type { Metadata } from "next";
import { FlightsList, type FlightListRow } from "@/components/student/flights/flights-list";
import { FLIGHTS, TRACKED_HOURS_DISCLAIMER, formatHours, statusLabel, trackedHours } from "@/lib/prototype-fixtures/flights";

export const metadata: Metadata = { title: "My flights — AfterFlight", robots: { index: false, follow: false } };

/** Milestone 1B fixture-parity Flights list -- mechanically the same as app/prototype/vector/flights/page.tsx, hrefs repointed at /v2/**. */
export default function V2MyFlights() {
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
