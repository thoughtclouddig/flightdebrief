import { beforeEach, describe, expect, it, vi } from "vitest";
import { authorize } from "@/lib/auth/guard";
import { sendSupportRequestEmail } from "@/lib/email";
import { POST } from "./route";
import type { Viewer } from "@/lib/viewer";

vi.mock("@/lib/auth/guard", () => ({ authorize: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendSupportRequestEmail: vi.fn() }));

const viewer = {
  user: { id: "user-1", name: "Morgan CFI", email: "morgan@example.com", authUserId: "morgan@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z", profileCompleted: true },
  organization: { id: "org-1", name: "Falcon Aviation", kind: "school" },
  role: "instructor",
} as unknown as Viewer;

function requestBody(body: object): Request {
  return new Request("http://localhost/api/support/contact", { method: "POST", body: JSON.stringify(body) });
}

describe("POST /api/support/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authorize).mockResolvedValue({ viewer });
  });

  it("rejects an unauthenticated request the same way every other authorized route does", async () => {
    vi.mocked(authorize).mockResolvedValue({ response: Response.json({ error: "Not signed in" }, { status: 401 }) as never });

    const res = await POST(requestBody({ context: "CFI", message: "Help" }));

    expect(res.status).toBe(401);
    expect(sendSupportRequestEmail).not.toHaveBeenCalled();
  });

  it("rejects an empty message without sending anything", async () => {
    const res = await POST(requestBody({ context: "CFI", message: "   " }));

    expect(res.status).toBe(400);
    expect(sendSupportRequestEmail).not.toHaveBeenCalled();
  });

  it("rejects a message over the length cap", async () => {
    const res = await POST(requestBody({ context: "CFI", message: "x".repeat(4001) }));

    expect(res.status).toBe(400);
    expect(sendSupportRequestEmail).not.toHaveBeenCalled();
  });

  it("sends using the authenticated viewer's own identity, not anything the client could spoof", async () => {
    vi.mocked(sendSupportRequestEmail).mockResolvedValue(true);

    const res = await POST(requestBody({ context: "CFI", message: "The search isn't working." }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ sent: true });
    expect(sendSupportRequestEmail).toHaveBeenCalledWith({
      fromName: "Morgan CFI",
      fromEmail: "morgan@example.com",
      context: "CFI",
      message: "The search isn't working.",
    });
  });

  it("defaults context to General when the client omits it", async () => {
    vi.mocked(sendSupportRequestEmail).mockResolvedValue(true);

    await POST(requestBody({ message: "Help" }));

    expect(sendSupportRequestEmail).toHaveBeenCalledWith(expect.objectContaining({ context: "General" }));
  });

  it("reports sent: false without erroring when the email provider fails", async () => {
    vi.mocked(sendSupportRequestEmail).mockResolvedValue(false);

    const res = await POST(requestBody({ context: "CFI", message: "Help" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ sent: false });
  });
});
