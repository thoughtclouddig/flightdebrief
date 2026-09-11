import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SupportContactForm } from "./support-contact-form";

describe("SupportContactForm — replaces a dead mailto: link", () => {
  it("renders as a row, not a mailto: link -- no href pointing off-app", () => {
    const markup = renderToStaticMarkup(<SupportContactForm context="CFI" />);

    expect(markup).not.toContain("mailto:");
    expect(markup).toContain("Email support");
  });

  it("initial state is the collapsed row, not the message form -- no textarea visible up front", () => {
    const markup = renderToStaticMarkup(<SupportContactForm context="CFI" />);

    expect(markup).not.toContain("<textarea");
  });
});
