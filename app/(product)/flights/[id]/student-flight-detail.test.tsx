import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StudentFlightDetail } from "./student-flight-detail";
import type { FlightWithRelations } from "@/lib/types";

function flight(overrides: Partial<FlightWithRelations> = {}): FlightWithRelations {
  return {
    id: "flight-1",
    userId: "student-1",
    organizationId: "org-1",
    aircraftId: "aircraft-1",
    departureAirport: "KFFZ",
    arrivalAirport: "KFFZ",
    flightDate: "2026-08-20",
    durationMinutes: 60,
    instructorId: null,
    reservationId: null,
    fr24FlightId: null,
    externalProvider: null,
    externalId: null,
    debriefStatus: "in_progress",
    track: null,
    createdAt: "2026-08-20T20:00:00.000Z",
    aircraft: {
      id: "aircraft-1",
      tailNumber: "N123AB",
      type: "Cessna 172",
      make: "Cessna",
      model: "172",
      homeAirport: "KFFZ",
      organizationId: "org-1",
      status: "active",
      externalProvider: null,
      externalId: null,
    },
    instructor: null,
    ...overrides,
  };
}

describe("StudentFlightDetail", () => {
  it(
    "never shows a dead 'waiting on your CFI' message -- regression for a solo/no-CFI " +
      "flight in a guided/light org showing the org's default guidance mode as if it were " +
      "this specific flight's own state; every flight (solo or instructional, any guidance " +
      "mode) goes straight into /debrief, whose own resolver picks the real next step",
    () => {
      const markup = renderToStaticMarkup(
        <StudentFlightDetail
          flight={flight()}
          hasPendingDebrief={false}
          guidanceMode="guided"
          skillProgressions={[]}
          certificateType={null}
        />,
      );

      expect(markup).not.toContain("Waiting on your CFI");
      expect(markup).toContain(`href="/flights/${"flight-1"}/debrief"`);
    },
  );

  // hasPendingDebrief={true} isn't exercised here -- it renders
  // ResumeDebriefButton, which calls useRouter() and throws outside an
  // actual Next.js app-router tree (see components/school-v2/
  // route-containment.test.tsx's doc comment for the same constraint).
});
