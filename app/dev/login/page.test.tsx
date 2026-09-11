import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DevLoginPage from "./page";

describe("DevLoginPage — quick demo start links", () => {
  it("links each core use case straight to its /api/demo/start persona, one click", () => {
    const markup = renderToStaticMarkup(<DevLoginPage />);

    expect(markup).toContain('href="/api/demo/start?persona=cfi"');
    expect(markup).toContain('href="/api/demo/start?persona=school"');
    expect(markup).toContain('href="/api/demo/start?persona=pilot-real"');
  });

  it("still renders the named seed-persona list underneath, unchanged", () => {
    const markup = renderToStaticMarkup(<DevLoginPage />);

    expect(markup).toContain("Falcon Aviation");
    expect(markup).toContain('href="/api/auth/dev-login?email=');
  });
});
