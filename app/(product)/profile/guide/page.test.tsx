import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GuidePage from "./page";

describe("(product) /profile/guide", () => {
  it("wires GuideScreen to the real (product) Profile route, not /v2/**, with no fixture import", () => {
    const markup = renderToStaticMarkup(<GuidePage />);

    expect(markup).toContain('href="/profile"');
    expect(markup).not.toContain("/v2/");
  });
});
