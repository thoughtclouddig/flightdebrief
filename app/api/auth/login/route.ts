import { NextResponse, type NextRequest } from "next/server";
import { createMagicLinkJwt } from "@/lib/auth/session";
import { tryMarkMagicLinkSent } from "@/lib/auth/store";
import { appOrigin, sendMagicLinkEmail } from "@/lib/email";

/**
 * Email magic-link sign-in, step 1: POST { email } mints a short-lived
 * signed token and emails a callback link. Always responds success so the
 * endpoint can't be used to probe which emails have accounts. A persistent
 * per-email cooldown (Postgres, survives restarts/instances) keeps it from
 * spamming arbitrary inboxes.
 */
const COOLDOWN_SECONDS = 60;

export async function POST(request: NextRequest) {
  let email: string | undefined;
  try {
    email = (await request.json())?.email;
  } catch {
    /* fall through to validation */
  }
  const normalized = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    if (await tryMarkMagicLinkSent(normalized, COOLDOWN_SECONDS)) {
      const origin = appOrigin();
      if (!origin) {
        console.error("[auth] cannot determine app origin; magic link not sent.");
      } else {
        const token = await createMagicLinkJwt(normalized);
        const url = new URL("/api/auth/callback", origin);
        url.searchParams.set("token", token);
        await sendMagicLinkEmail({ to: normalized, url: url.toString() });
      }
    }
  } catch (err) {
    // Still return the uniform success response -- no behavior leak.
    console.error("[auth] magic-link send failed:", err);
  }

  // Identical response whether or not the email exists or was actually sent.
  return NextResponse.json({ ok: true });
}
