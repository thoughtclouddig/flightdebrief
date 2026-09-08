import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SupportPage from "./page";

describe("(product) /profile/support", () => {
  it("wires SupportScreen to real (product) routes, not /v2/**", () => {
    const markup = renderToStaticMarkup(<SupportPage />);

    expect(markup).toContain('href="/profile"');
    expect(markup).toContain('href="/profile/guide"');
    expect(markup).toContain('href="/train"');
    expect(markup).not.toContain("/v2/");
  });
});
