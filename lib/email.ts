import { ReplitConnectors } from "@replit/connectors-sdk";
import type { OrgRole } from "@/lib/types";

const connectors = new ReplitConnectors();

/** Sender must be a Resend-verified domain address, or the shared test sender. */
const FROM = process.env.INVITE_EMAIL_FROM ?? "AfterFlight <onboarding@resend.dev>";

/**
 * Sends via the Resend HTTP API. Prefers RESEND_API_KEY when set (portable
 * across environments); otherwise uses the workspace's Resend connection.
 */
async function sendViaResend(payload: object): Promise<Response> {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    return fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
    });
  }
  return connectors.proxy("resend", "/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Sends the "you've been invited" email via the Resend connection.
 * Best-effort: callers should not fail the invite if the email fails --
 * the invitee can still log in once told the URL. Returns true on success.
 */
/**
 * Server-controlled public origin for links in outgoing email. Never derived
 * from request headers -- forwarded-host values are attacker-influenceable
 * and would end up as phishing links in real inboxes. REPLIT_DOMAINS holds
 * the deployment's domain in production and the dev domain in the workspace.
 */
export function appOrigin(): string | null {
  const configured = process.env.APP_BASE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  return domain ? `https://${domain}` : null;
}

export async function sendInviteEmail(input: {
  to: string;
  name: string;
  role: OrgRole;
  organizationName: string;
}): Promise<boolean> {
  const origin = appOrigin();
  if (!origin) {
    console.error("[email] cannot determine app origin (APP_BASE_URL / REPLIT_DOMAINS unset); invite email not sent.");
    return false;
  }
  const roleLabel = input.role === "instructor" ? "an instructor (CFI)" : input.role === "admin" ? "an admin" : "a student";
  const loginUrl = new URL("/login", origin).toString();
  const subject = `You're invited to ${input.organizationName} on AfterFlight`;
  const text = [
    `Hi ${input.name},`,
    ``,
    `You've been added to ${input.organizationName} on AfterFlight as ${roleLabel}.`,
    ``,
    `To get started, enter this email address (${input.to}) on the sign-in page and we'll send you a one-time sign-in link:`,
    loginUrl,
    ``,
    `No password or account setup needed -- just make sure you use this same email so your invitation is recognized.`,
  ].join("\n");
  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#101727">
      <h2 style="margin:0 0 16px">You're invited to ${escapeHtml(input.organizationName)}</h2>
      <p>Hi ${escapeHtml(input.name)},</p>
      <p>You've been added to <strong>${escapeHtml(input.organizationName)}</strong> on AfterFlight as ${roleLabel}.</p>
      <p>To get started, enter this email address (<strong>${escapeHtml(input.to)}</strong>) on the sign-in page and we'll send you a one-time sign-in link:</p>
      <p style="margin:24px 0">
        <a href="${escapeHtml(loginUrl)}" style="background:#f07621;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Log in to AfterFlight</a>
      </p>
      <p style="color:#56636f;font-size:14px">No password or account setup needed — just make sure you use this same email so your invitation is recognized.</p>
    </div>`;

  try {
    const response = await sendViaResend({ from: FROM, to: [input.to], subject, text, html });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[email] invite email to ${input.to} failed: ${response.status} ${detail}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email] invite email to ${input.to} failed:`, err);
    return false;
  }
}

/**
 * Emails a sign-in (magic) link. Same conventions as sendInviteEmail:
 * server-controlled origin, escaped HTML, best-effort (returns false on
 * failure, never throws).
 */
export async function sendMagicLinkEmail(input: { to: string; url: string }): Promise<boolean> {
  const subject = "Your AfterFlight sign-in link";
  const text = [
    `Click to sign in to AfterFlight:`,
    input.url,
    ``,
    `This link expires in 15 minutes. If you didn't request it, you can ignore this email.`,
  ].join("\n");
  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#101727">
      <h2 style="margin:0 0 16px">Sign in to AfterFlight</h2>
      <p style="margin:24px 0">
        <a href="${escapeHtml(input.url)}" style="background:#f07621;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Sign in</a>
      </p>
      <p style="color:#56636f;font-size:14px">This link expires in 15 minutes. If you didn't request it, you can ignore this email.</p>
    </div>`;

  try {
    const response = await sendViaResend({ from: FROM, to: [input.to], subject, text, html });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[email] magic link to ${input.to} failed: ${response.status} ${detail}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email] magic link to ${input.to} failed:`, err);
    return false;
  }
}

/** Emails a self-serve signup confirmation link -- same conventions as sendMagicLinkEmail. */
export async function sendSignupLinkEmail(input: { to: string; url: string; name: string }): Promise<boolean> {
  const subject = "Confirm your AfterFlight account";
  const text = [
    `Hi ${input.name},`,
    ``,
    `Click to confirm your AfterFlight account and set up your organization:`,
    input.url,
    ``,
    `This link expires in 15 minutes. If you didn't request it, you can ignore this email.`,
  ].join("\n");
  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#101727">
      <h2 style="margin:0 0 16px">Confirm your AfterFlight account</h2>
      <p>Hi ${escapeHtml(input.name)},</p>
      <p style="margin:24px 0">
        <a href="${escapeHtml(input.url)}" style="background:#f07621;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Confirm and continue</a>
      </p>
      <p style="color:#56636f;font-size:14px">This link expires in 15 minutes. If you didn't request it, you can ignore this email.</p>
    </div>`;

  try {
    const response = await sendViaResend({ from: FROM, to: [input.to], subject, text, html });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[email] signup link to ${input.to} failed: ${response.status} ${detail}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email] signup link to ${input.to} failed:`, err);
    return false;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
