import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SchoolSignupPage from "./page";

describe("SchoolSignupPage — free-forever copy, no debrief cap", () => {
  it("no longer promises a specific free-debrief count", () => {
    const markup = renderToStaticMarkup(<SchoolSignupPage />);

    expect(markup).not.toContain("25 debriefs");
    expect(markup).toContain("Free for your school");
  });
});
