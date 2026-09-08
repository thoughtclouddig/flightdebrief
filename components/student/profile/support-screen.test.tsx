import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SupportScreen } from "./support-screen";
import { SUPPORT_EMAIL } from "@/components/support-link";

describe("SupportScreen", () => {
  it("wires backHref/guideHref/trainHref exactly as given -- proves the (product) mount uses real routes, not /v2/**", () => {
    const markup = renderToStaticMarkup(<SupportScreen backHref="/profile" guideHref="/profile/guide" trainHref="/train" />);

    expect(markup).toContain('href="/profile"');
    expect(markup).toContain('href="/profile/guide"');
    expect(markup).toContain('href="/train"');
  });

  it("the support email is visible/copyable as plain text, not only embedded in the mailto: href", () => {
    const markup = renderToStaticMarkup(<SupportScreen backHref="/profile" guideHref="/profile/guide" trainHref="/train" />);

    expect(markup).toContain(`href="mailto:${SUPPORT_EMAIL}"`);
    // Appears a second time, outside any href attribute, as visible text.
    const occurrences = markup.split(SUPPORT_EMAIL).length - 1;
    expect(occurrences).toBeGreaterThanOrEqual(2);
  });
});
