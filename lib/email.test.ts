import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendSupportRequestEmail } from "./email";

describe("sendSupportRequestEmail", () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.RESEND_API_KEY;

  beforeEach(() => {
    process.env.RESEND_API_KEY = "test-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.RESEND_API_KEY = originalApiKey;
    vi.restoreAllMocks();
  });

  it("sends to the support inbox, not the submitter, and sets replyTo to the submitter", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const sent = await sendSupportRequestEmail({
      fromName: "Morgan CFI",
      fromEmail: "morgan@example.com",
      context: "CFI",
      message: "The tail number search isn't returning results.",
    });

    expect(sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(init.body as string);
    expect(payload.to).toEqual(["support@getafterflight.com"]);
    expect(payload.reply_to).toBe("morgan@example.com");
    expect(payload.text).toContain("Morgan CFI");
    expect(payload.text).toContain("The tail number search isn't returning results.");
  });

  it("is best-effort: a failed send returns false rather than throwing", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("failed", { status: 500 })) as unknown as typeof fetch;

    const sent = await sendSupportRequestEmail({
      fromName: "Morgan CFI",
      fromEmail: "morgan@example.com",
      context: "CFI",
      message: "Test",
    });

    expect(sent).toBe(false);
  });
});
