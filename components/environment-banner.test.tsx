import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { resolveEnvironmentBanner } from "@/lib/build-info";
import { EnvironmentBanner } from "./environment-banner";

vi.mock("@/lib/build-info", () => ({ resolveEnvironmentBanner: vi.fn() }));

describe("EnvironmentBanner — diagnostic chrome only, never product UI", () => {
  it("Development: renders 'DEVELOPMENT' with the build SHA", () => {
    vi.mocked(resolveEnvironmentBanner).mockReturnValue({ label: "DEVELOPMENT", sha: "abc123def" });

    const markup = renderToStaticMarkup(<EnvironmentBanner />);

    expect(markup).toContain("DEVELOPMENT");
    expect(markup).toContain("abc123def");
  });

  it("Staging: renders 'STAGING' with the build SHA", () => {
    vi.mocked(resolveEnvironmentBanner).mockReturnValue({ label: "STAGING", sha: "abc123def" });

    const markup = renderToStaticMarkup(<EnvironmentBanner />);

    expect(markup).toContain("STAGING");
    expect(markup).toContain("abc123def");
  });

  it("Production: renders nothing at all", () => {
    vi.mocked(resolveEnvironmentBanner).mockReturnValue(null);

    const markup = renderToStaticMarkup(<EnvironmentBanner />);

    expect(markup).toBe("");
  });

  it("handles a missing build SHA honestly -- no fabricated placeholder value", () => {
    vi.mocked(resolveEnvironmentBanner).mockReturnValue({ label: "STAGING", sha: null });

    const markup = renderToStaticMarkup(<EnvironmentBanner />);

    expect(markup).toContain("STAGING");
    expect(markup).not.toMatch(/·\s*null/i);
  });

  it("is not fixed/floating -- no position:fixed anywhere in its markup", () => {
    vi.mocked(resolveEnvironmentBanner).mockReturnValue({ label: "DEVELOPMENT", sha: "abc123def" });

    const markup = renderToStaticMarkup(<EnvironmentBanner />);

    expect(markup).not.toMatch(/\bfixed\b/);
  });

  it("reserves top safe-area space via a dedicated spacer, matching the bottom nav's own pattern", () => {
    vi.mocked(resolveEnvironmentBanner).mockReturnValue({ label: "DEVELOPMENT", sha: "abc123def" });

    const markup = renderToStaticMarkup(<EnvironmentBanner />);

    expect(markup).toMatch(/h-\[env\(safe-area-inset-top\)\]/);
  });
});
