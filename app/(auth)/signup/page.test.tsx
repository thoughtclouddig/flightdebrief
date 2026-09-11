import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SignupRolePickerPage from "./page";

describe("SignupRolePickerPage — school badge reflects free-forever access", () => {
  it("no longer advertises a 25-debrief cap", () => {
    const markup = renderToStaticMarkup(<SignupRolePickerPage />);

    expect(markup).not.toContain("25 Debriefs");
    expect(markup).toContain("Free for your school");
  });

  it("leaves the student and independent-CFI badges untouched", () => {
    const markup = renderToStaticMarkup(<SignupRolePickerPage />);

    expect(markup).toContain("First 3 Flights Free");
    expect(markup).toContain(">Free<");
  });
});
