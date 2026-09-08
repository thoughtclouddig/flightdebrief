import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QuietRow } from "./ui";

describe("QuietRow external prop", () => {
  it("opens in a new tab (never navigates the app away) when external is set", () => {
    const markup = renderToStaticMarkup(<QuietRow href="/data-handling" external label="Your audio & your data" />);

    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
  });

  it("navigates normally, with no target/rel, when external is omitted", () => {
    const markup = renderToStaticMarkup(<QuietRow href="/profile/support" label="Support" />);

    expect(markup).not.toContain("target=");
    expect(markup).not.toContain("rel=");
  });
});
