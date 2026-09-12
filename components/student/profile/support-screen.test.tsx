import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SupportScreen } from "./support-screen";
import { SUPPORT_EMAIL } from "@/lib/support-email";

describe("SupportScreen", () => {
  it("wires backHref/guideHref/trainHref exactly as given -- proves the (product) mount uses real routes, not /v2/**", () => {
    const markup = renderToStaticMarkup(<SupportScreen backHref="/profile" guideHref="/profile/guide" trainHref="/train" />);

    expect(markup).toContain('href="/profile"');
    expect(markup).toContain('href="/profile/guide"');
    expect(markup).toContain('href="/train"');
  });

  it("the support email is visible/copyable as plain text in the footer disclaimer", () => {
    const markup = renderToStaticMarkup(<SupportScreen backHref="/profile" guideHref="/profile/guide" trainHref="/train" />);

    expect(markup).toContain(SUPPORT_EMAIL);
  });

  it("no longer uses a raw mailto: link -- support goes through the in-app contact form instead", () => {
    const markup = renderToStaticMarkup(<SupportScreen backHref="/profile" guideHref="/profile/guide" trainHref="/train" />);

    expect(markup).not.toContain("mailto:");
  });

  it(
    "imports SUPPORT_EMAIL from a directive-free module, not a \"use client\" component -- " +
      "regression for the RSC crash where a Server Component read a plain string exported " +
      "from components/support-link.tsx and Next's bundler threw on the cross-boundary read",
    () => {
      const source = readFileSync(new URL("./support-screen.tsx", import.meta.url), "utf8");
      const importLine = source.split("\n").find((line) => line.includes("SUPPORT_EMAIL"));
      expect(importLine).toMatch(/from "@\/lib\/support-email"/);

      const emailModuleSource = readFileSync(new URL("../../../lib/support-email.ts", import.meta.url), "utf8");
      expect(emailModuleSource).not.toMatch(/^"use client"/m);
    },
  );
});
