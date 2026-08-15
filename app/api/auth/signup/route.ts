import { NextResponse, type NextRequest } from "next/server";
import { createSignupLinkJwt } from "@/lib/auth/session";
import { tryMarkMagicLinkSent } from "@/lib/auth/store";
import { appOrigin, sendSignupLinkEmail } from "@/lib/email";

/**
 * Self-serve independent-CFI signup, step 1: POST { name, email, orgName? }
 * mints a short-lived signed token and emails a confirmation link -- nothing
 * is created in the database until that link is clicked (see
 * lib/auth/store.ts's resolveSignupOnLogin), so an unverified/bot email
 * never produces a junk organization. Same cooldown table as /api/auth/login
 * on purpose -- it's the same anti-abuse intent, keyed by the same email.
 */
const COOLDOWN_SECONDS = 60;

export async function POST(request: NextRequest) {
  let body: { name?: string; email?: string; orgName?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* fall through to validation */
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const normalized = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const orgName = typeof body.orgName === "string" ? body.orgName.trim() : "";

  if (!name || !normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return NextResponse.json({ error: "Enter your name and a valid email address." }, { status: 400 });
  }

  try {
    if (await tryMarkMagicLinkSent(normalized, COOLDOWN_SECONDS)) {
      const origin = appOrigin();
      if (!origin) {
        console.error("[auth] cannot determine app origin; signup link not sent.");
      } else {
        const token = await createSignupLinkJwt({ email: normalized, name, orgName: orgName || null });
        const url = new URL("/api/auth/callback", origin);
        url.searchParams.set("token", token);
        await sendSignupLinkEmail({ to: normalized, url: url.toString(), name });
      }
    }
  } catch (err) {
    // Still return the uniform success response -- no behavior leak.
    console.error("[auth] signup-link send failed:", err);
  }

  // Identical response whether or not this is a new email.
  return NextResponse.json({ ok: true });
}
