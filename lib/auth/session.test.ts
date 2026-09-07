import { SignJWT } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import { createEmailChangeJwt, verifyEmailChangeJwt } from "./session";

beforeAll(() => {
  // Throwaway secret for this process only -- never a real credential.
  process.env.SESSION_SECRET = "test-secret-not-a-real-credential";
});

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.SESSION_SECRET!);
}

describe("email-change JWT returnContext", () => {
  it("round-trips returnContext: 'school-v2-settings' through create + verify", async () => {
    const token = await createEmailChangeJwt({ userId: "user-1", newEmail: "new@example.com", returnContext: "school-v2-settings" });
    const claims = await verifyEmailChangeJwt(token);

    expect(claims?.returnContext).toBe("school-v2-settings");
  });

  it("returns undefined returnContext when none was given, unchanged from before this feature existed", async () => {
    const token = await createEmailChangeJwt({ userId: "user-1", newEmail: "new@example.com" });
    const claims = await verifyEmailChangeJwt(token);

    expect(claims?.returnContext).toBeUndefined();
  });

  it("never passes through an arbitrary string as returnContext, even from a hand-forged token bypassing createEmailChangeJwt's type -- the closed allowlist lives in verify, not just in the caller", async () => {
    const forged = await new SignJWT({ purpose: "email-change", userId: "user-1", returnContext: "https://evil.example.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("new@example.com")
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + 900)
      .sign(getSecret());

    const claims = await verifyEmailChangeJwt(forged);

    expect(claims?.returnContext).toBeUndefined();
    expect(claims?.returnContext).not.toBe("https://evil.example.com");
  });

  it("still rejects a token with no valid purpose/claims regardless of returnContext", async () => {
    const claims = await verifyEmailChangeJwt("not-a-real-token");
    expect(claims).toBeNull();
  });
});
