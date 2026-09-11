import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { resolveEnvironmentBanner } from "@/lib/build-info";
import { EnvironmentBanner } from "./environment-banner";

vi.mock("@/lib/build-info", () => ({ resolveEnvironmentBanner: vi.fn() }));
vi.mock("next/server", () => ({ connection: vi.fn().mockResolvedValue(undefined) }));

/**
 * EnvironmentBanner is an async Server Component -- calling it directly
 * (rather than mounting `<EnvironmentBanner />`) and awaiting the result is
 * how you exercise an async component with plain react-dom/server, which has
 * no built-in await for components the way Next's own RSC renderer does.
 */
async function render() {
  return renderToStaticMarkup(await EnvironmentBanner());
}

describe("EnvironmentBanner — diagnostic chrome only, never product UI", () => {
  it("Development: renders 'DEVELOPMENT' with the build SHA", async () => {
    vi.mocked(resolveEnvironmentBanner).mockReturnValue({ label: "DEVELOPMENT", sha: "abc123def" });

    const markup = await render();

    expect(markup).toContain("DEVELOPMENT");
    expect(markup).toContain("abc123def");
  });

  it("Staging: renders 'STAGING' with the build SHA", async () => {
    vi.mocked(resolveEnvironmentBanner).mockReturnValue({ label: "STAGING", sha: "abc123def" });

    const markup = await render();

    expect(markup).toContain("STAGING");
    expect(markup).toContain("abc123def");
  });

  it("Production: renders nothing at all", async () => {
    vi.mocked(resolveEnvironmentBanner).mockReturnValue(null);

    const markup = await render();

    expect(markup).toBe("");
  });

  it("handles a missing build SHA honestly -- no fabricated placeholder value", async () => {
    vi.mocked(resolveEnvironmentBanner).mockReturnValue({ label: "STAGING", sha: null });

    const markup = await render();

    expect(markup).toContain("STAGING");
    expect(markup).not.toMatch(/·\s*null/i);
  });

  it("is not fixed/floating -- no position:fixed anywhere in its markup", async () => {
    vi.mocked(resolveEnvironmentBanner).mockReturnValue({ label: "DEVELOPMENT", sha: "abc123def" });

    const markup = await render();

    expect(markup).not.toMatch(/\bfixed\b/);
  });

  it("reserves top safe-area space via a dedicated spacer, matching the bottom nav's own pattern", async () => {
    vi.mocked(resolveEnvironmentBanner).mockReturnValue({ label: "DEVELOPMENT", sha: "abc123def" });

    const markup = await render();

    expect(markup).toMatch(/h-\[env\(safe-area-inset-top\)\]/);
  });

  it("resolves the environment at request time, not once at module load -- calls connection() before reading it", async () => {
    const { connection } = await import("next/server");
    vi.mocked(resolveEnvironmentBanner).mockReturnValue({ label: "DEVELOPMENT", sha: "abc123def" });

    await render();

    expect(connection).toHaveBeenCalled();
  });
});
