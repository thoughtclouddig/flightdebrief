import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { resolveBuildBadge } from "@/lib/build-info";
import { BuildEnvBadge } from "./build-env-badge";

vi.mock("@/lib/build-info", () => ({ resolveBuildBadge: vi.fn() }));

describe("BuildEnvBadge — diagnostic chrome only, never product UI", () => {
  it("Development: renders 'DEV' with the build SHA", () => {
    vi.mocked(resolveBuildBadge).mockReturnValue({ label: "DEV", sha: "abc123def" });

    const markup = renderToStaticMarkup(<BuildEnvBadge />);

    expect(markup).toContain("DEV");
    expect(markup).toContain("abc123def");
  });

  it("Staging: renders 'STAGING' with the build SHA", () => {
    vi.mocked(resolveBuildBadge).mockReturnValue({ label: "STAGING", sha: "abc123def" });

    const markup = renderToStaticMarkup(<BuildEnvBadge />);

    expect(markup).toContain("STAGING");
    expect(markup).toContain("abc123def");
  });

  it("Production: renders nothing at all", () => {
    vi.mocked(resolveBuildBadge).mockReturnValue(null);

    const markup = renderToStaticMarkup(<BuildEnvBadge />);

    expect(markup).toBe("");
  });

  it("is inert -- never intercepts a tap meant for something underneath it", () => {
    vi.mocked(resolveBuildBadge).mockReturnValue({ label: "DEV", sha: "abc123def" });

    const markup = renderToStaticMarkup(<BuildEnvBadge />);

    expect(markup).toContain("pointer-events-none");
  });

  it("handles a missing build SHA honestly -- no fabricated placeholder value", () => {
    vi.mocked(resolveBuildBadge).mockReturnValue({ label: "STAGING", sha: null });

    const markup = renderToStaticMarkup(<BuildEnvBadge />);

    expect(markup).toContain("STAGING");
    expect(markup).not.toMatch(/·\s*null/i);
  });
});
