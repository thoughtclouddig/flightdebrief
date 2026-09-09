import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ObjectiveConfirmationForm } from "./objective-confirmation-form";

// TaskPickerForm (nested inside) calls useRouter() for its post-submit
// redirect -- not reachable in a static render, and not exercised by these
// copy/layout assertions.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

const BASE_PROPS = {
  flightId: "flight-1",
  allSkills: [],
  route: "KFFZ → KFFZ",
  durationLabel: "0.1 hr",
  dateLabel: "Aug 31",
  aircraftType: "P28A",
  tailNumber: "N28086",
  redirectTo: "/flights/flight-1/debrief/confirm",
};

describe("ObjectiveConfirmationForm — Student voice, never 'we'", () => {
  it("asks 'What did you work on?', never 'What did we work on?'", () => {
    const markup = renderToStaticMarkup(<ObjectiveConfirmationForm {...BASE_PROPS} hasInstructor={false} />);

    expect(markup).toMatch(/What did you work on\?/);
    expect(markup).not.toMatch(/What did we work on\?/i);
  });

  it("renders a compact single-line flight identity, not a giant route headline", () => {
    const markup = renderToStaticMarkup(<ObjectiveConfirmationForm {...BASE_PROPS} hasInstructor={false} />);

    expect(markup).toMatch(/KFFZ → KFFZ · 0\.1 hr · Aug 31 · P28A · N28086/);
    // The only large heading text is the question itself, not the route repeated as a headline.
    const headingMatches = markup.match(/<h1[^>]*>([^<]*)<\/h1>/g) ?? [];
    expect(headingMatches.every((h) => !h.includes("KFFZ"))).toBe(true);
  });

  it("never mentions an instructor for a Solo flight", () => {
    const markup = renderToStaticMarkup(<ObjectiveConfirmationForm {...BASE_PROPS} hasInstructor={false} />);

    expect(markup).not.toMatch(/instructor/i);
  });

  it("keeps the instructor-handoff explanation for an instructor flight", () => {
    const markup = renderToStaticMarkup(<ObjectiveConfirmationForm {...BASE_PROPS} hasInstructor />);

    expect(markup).toMatch(/your instructor rates the same list/i);
  });
});
