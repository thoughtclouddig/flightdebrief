import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ObjectivesScreen } from "./objectives-screen";

const BASE_PROPS = {
  lessonTitle: "Crosswind + Short Field",
  route: "KFFZ → KFFZ",
  durationLabel: "1.2 hr",
  dateLabel: "Sep 8, 2026",
  aircraftType: "Cessna 172",
  tailNumber: "N123AB",
  objectives: ["Crosswind landings", "Short-field technique"],
  startHref: "/flights/flight-1/debrief/self-assessment",
};

describe("ObjectivesScreen — no dead-end Change action", () => {
  it("never renders a Change link on the flight-identity card", () => {
    const markup = renderToStaticMarkup(<ObjectivesScreen {...BASE_PROPS} hasInstructor={false} instructorFirstName={null} />);

    expect(markup).not.toMatch(/Change/);
  });
});

describe("ObjectivesScreen — solo vs instructional copy", () => {
  it("never mentions an instructor when hasInstructor is false, regardless of a stray instructorFirstName", () => {
    const markup = renderToStaticMarkup(<ObjectivesScreen {...BASE_PROPS} hasInstructor={false} instructorFirstName={null} />);

    expect(markup).not.toMatch(/instructor/i);
    expect(markup).toMatch(/your own read of the flight/i);
  });

  it("names the instructor when one exists and a first name is known", () => {
    const markup = renderToStaticMarkup(<ObjectivesScreen {...BASE_PROPS} hasInstructor instructorFirstName="Jake" />);

    expect(markup).toMatch(/hand the phone to Jake/i);
  });

  it("falls back to generic instructor copy when one exists but no first name could be resolved", () => {
    const markup = renderToStaticMarkup(<ObjectivesScreen {...BASE_PROPS} hasInstructor instructorFirstName={null} />);

    expect(markup).toMatch(/hand the phone to your instructor/i);
  });
});
