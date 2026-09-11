import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DevLoginPage from "./page";

describe("DevLoginPage — real-account logins, one per core use case", () => {
  it("links each role to an instant dev-login session, no magic link required", () => {
    const markup = renderToStaticMarkup(<DevLoginPage />);

    for (const email of [
      "andyrenk+indystudent@gmail.com",
      "andyrenk+student@gmail.com",
      "andyrenk+cfi@gmail.com",
      "andyrenk+indycfi@gmail.com",
      "andyrenk+admin@gmail.com",
    ]) {
      expect(markup).toContain(`href="/api/auth/dev-login?email=${encodeURIComponent(email)}"`);
    }
  });

  it("still offers a magic-link fallback per row, for when the instant row doesn't exist in this database", () => {
    const markup = renderToStaticMarkup(<DevLoginPage />);

    expect(markup).toContain(`href="/login?email=${encodeURIComponent("andyrenk+indystudent@gmail.com")}"`);
    expect(markup).toContain("via magic link");
  });

  it("no longer offers the ephemeral demo-start shortcuts or the full seed-persona list", () => {
    const markup = renderToStaticMarkup(<DevLoginPage />);

    expect(markup).not.toContain("/api/demo/start");
    // Falcon Aviation is legitimate here -- Danny and Jordan's own org
    // context. Mesa/Prescott were the extra seed-persona orgs this page no
    // longer lists at all.
    expect(markup).not.toContain("Mesa Flight Academy");
    expect(markup).not.toContain("Prescott Aviation");
  });
});
