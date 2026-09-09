import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StudentDebriefV2 } from "./student-debrief-v2";
import type { FlightWithRelations, StructuredDebrief } from "@/lib/types";

const BASE_FLIGHT: FlightWithRelations = {
  id: "flight-1",
  userId: "student-1",
  organizationId: "org-1",
  aircraftId: "aircraft-1",
  departureAirport: "KFFZ",
  arrivalAirport: "KFFZ",
  flightDate: "2026-08-30",
  durationMinutes: 100,
  instructorId: null,
  reservationId: null,
  fr24FlightId: "fr24-1",
  externalProvider: null,
  externalId: null,
  debriefStatus: "complete",
  track: null,
  createdAt: "2026-08-30T00:00:00.000Z",
  instructor: null,
  aircraft: {
    id: "aircraft-1",
    tailNumber: "N28086",
    type: "Piper PA-28A",
    make: "Piper",
    model: "PA-28A",
    homeAirport: "KFFZ",
    organizationId: "org-1",
    status: "active",
    externalProvider: null,
    externalId: null,
  },
};

const BASE_RESULT: StructuredDebrief = {
  flightSummary: "",
  narrativeRecap: "",
  whatWeDid: [],
  wentWell: ["Smooth landings"],
  needsWork: ["Radio calls"],
  instructorGuidance: [],
  instructorAssistance: [],
  riskManagementNotes: [],
  assessmentDifferences: [],
  actionItems: [],
  nextLessonFocus: [],
  studyReferences: [],
  nextFlightCue: "",
  nextFlightCueContext: "",
};

const BASE_PROPS = {
  result: BASE_RESULT,
  tasks: [],
  certificateType: null,
  ttsEnabled: false,
  flightId: "flight-1",
  audioDurationSeconds: 0,
  nextLessonHref: null,
};

describe("StudentDebriefV2 — kicker never implies an instructor on a Solo flight", () => {
  it("omits any instructor mention when flight.instructor is null", () => {
    const markup = renderToStaticMarkup(<StudentDebriefV2 {...BASE_PROPS} flight={BASE_FLIGHT} />);

    expect(markup).not.toMatch(/your instructor/i);
    expect(markup).not.toMatch(/instructor/i);
  });

  it("names the instructor in the kicker when the flight has one", () => {
    const flight: FlightWithRelations = { ...BASE_FLIGHT, instructor: { id: "i1", name: "Jake" } };
    const markup = renderToStaticMarkup(<StudentDebriefV2 {...BASE_PROPS} flight={flight} />);

    expect(markup).toMatch(/Jake/);
  });
});
