import { ReplitConnectors } from "@replit/connectors-sdk";
import type { OrgRole } from "@/lib/types";

const connectors = new ReplitConnectors();

/** Sender must be a Resend-verified domain address, or the shared test sender. */
const FROM = process.env.INVITE_EMAIL_FROM ?? "FlightDebrief <onboarding@resend.dev>";

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
function appOrigin(): string | null {
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
  const subject = `You're invited to ${input.organizationName} on FlightDebrief`;
  const text = [
    `Hi ${input.name},`,
    ``,
    `You've been added to ${input.organizationName} on FlightDebrief as ${roleLabel}.`,
    ``,
    `To get started, log in with the Replit account that uses this email address (${input.to}):`,
    loginUrl,
    ``,
    `If you don't have a Replit account yet, you can create one at that link -- just make sure it uses this same email so your invitation is recognized.`,
  ].join("\n");
  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
      <h2 style="margin:0 0 16px">You're invited to ${escapeHtml(input.organizationName)}</h2>
      <p>Hi ${escapeHtml(input.name)},</p>
      <p>You've been added to <strong>${escapeHtml(input.organizationName)}</strong> on FlightDebrief as ${roleLabel}.</p>
      <p>To get started, log in with the Replit account that uses this email address (<strong>${escapeHtml(input.to)}</strong>):</p>
      <p style="margin:24px 0">
        <a href="${escapeHtml(loginUrl)}" style="background:#1a1a1a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Log in to FlightDebrief</a>
      </p>
      <p style="color:#666;font-size:14px">If you don't have a Replit account yet, you can create one at that link — just make sure it uses this same email so your invitation is recognized.</p>
    </div>`;

  try {
    const response = await connectors.proxy("resend", "/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [input.to], subject, text, html }),
    });
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
