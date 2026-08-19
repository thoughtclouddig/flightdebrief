import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { createEmailChangeJwt } from "@/lib/auth/session";
import { getUserByEmail, tryMarkMagicLinkSent } from "@/lib/auth/store";
import { appOrigin, sendEmailChangeEmail } from "@/lib/email";

/**
 * Email-change, step 1: POST { newEmail } from an authenticated session.
 * Unlike /api/auth/login this DOES reveal whether the new address is taken
 * -- it's the caller's own account action, not a probe against someone
 * else's inbox, so there's no enumeration concern worth the worse UX of a
 * uniform response here.
 */
const COOLDOWN_SECONDS = 60;

export async function POST(request: Request) {
  const auth = await authorize();
  if (auth.response) return auth.response;
  const { viewer } = auth;

  let newEmail: string | undefined;
  try {
    newEmail = (await request.json())?.newEmail;
  } catch {
    /* fall through to validation */
  }
  const normalized = typeof newEmail === "string" ? newEmail.trim().toLowerCase() : "";
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (normalized === viewer.user.email.toLowerCase()) {
    return NextResponse.json({ error: "That's already your email address." }, { status: 400 });
  }

  const existing = await getUserByEmail(normalized);
  if (existing) {
    return NextResponse.json({ error: "That email is already in use by another AfterFlight account." }, { status: 409 });
  }

  if (!(await tryMarkMagicLinkSent(normalized, COOLDOWN_SECONDS))) {
    return NextResponse.json({ error: "A confirmation was already sent recently. Check your inbox." }, { status: 429 });
  }

  const origin = appOrigin();
  if (!origin) {
    console.error("[auth] cannot determine app origin; email-change link not sent.");
    return NextResponse.json({ error: "Couldn't send confirmation email. Try again shortly." }, { status: 500 });
  }

  const token = await createEmailChangeJwt({ userId: viewer.user.id, newEmail: normalized });
  const url = new URL("/api/auth/confirm-email-change", origin);
  url.searchParams.set("token", token);
  const sent = await sendEmailChangeEmail({ to: normalized, url: url.toString() });
  if (!sent) {
    return NextResponse.json({ error: "Couldn't send confirmation email. Try again shortly." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
