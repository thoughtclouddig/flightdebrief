import type { Metadata } from "next";
import { FlightsList, type FlightListRow } from "@/components/student/flights/flights-list";
import { FLIGHTS, TRACKED_HOURS_DISCLAIMER, formatHours, statusLabel, trackedHours } from "@/lib/prototype-fixtures/flights";
import { buildFixtureStudentHrefs } from "@/lib/prototype-fixtures/fixture-student-hrefs";

export const metadata: Metadata = { title: "My flights — AfterFlight", robots: { index: false, follow: false } };

const HREFS = buildFixtureStudentHrefs("/demo/student");

/** Public Student demo's Flights list -- the same FlightsList component and FLIGHTS fixture data app/v2/flights/page.tsx's fixture branch renders, hrefs built from /demo/student instead of /v2. */
export default function DemoStudentMyFlights() {
  const flights: FlightListRow[] = FLIGHTS.map((f) => ({
    id: f.id,
    href: HREFS.flightDetail(f.id),
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
      backHref={HREFS.profile}
      addFlightHref={HREFS.flightsNew}
      trackedHoursLabel={trackedHours()}
      trackedHoursDisclaimer={TRACKED_HOURS_DISCLAIMER}
      flights={flights}
    />
  );
}
