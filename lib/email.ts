import { ReplitConnectors } from "@replit/connectors-sdk";
import type { OrgRole } from "@/lib/types";
import { appOrigin } from "@/lib/email-origin";
import { renderEmail, escapeHtml, firstName, type EmailContent } from "@/lib/email-layout";

export { appOrigin };

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
 * One send path for every template. Each of these used to carry its own
 * identical try/catch, which is four places for the error handling to drift.
 * Best-effort by contract: returns false and logs rather than throwing, so a
 * failed send never fails the action that triggered it (an invite still
 * exists even if its email bounced).
 */
async function send(kind: string, to: string, subject: string, text: string, content: EmailContent): Promise<boolean> {
  try {
    const response = await sendViaResend({ from: FROM, to: [to], subject, text, html: renderEmail(content) });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[email] ${kind} to ${to} failed: ${response.status} ${detail}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email] ${kind} to ${to} failed:`, err);
    return false;
  }
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
    `Hi ${firstName(input.name)},`,
    ``,
    `You've been added to ${input.organizationName} on AfterFlight as ${roleLabel}.`,
    ``,
    `To get started, enter this email address (${input.to}) on the sign-in page and we'll send you a one-time sign-in link:`,
    loginUrl,
    ``,
    `No password or account setup needed -- just make sure you use this same email so your invitation is recognized.`,
  ].join("\n");

  return send("invite email", input.to, subject, text, {
    preheader: `You've been added as ${roleLabel}. No password needed.`,
    heading: `You're invited to ${escapeHtml(input.organizationName)}`,
    body: [
      `Hi ${escapeHtml(firstName(input.name))},`,
      `You've been added to <strong>${escapeHtml(input.organizationName)}</strong> on AfterFlight as ${roleLabel}.`,
      `There's no password to create. Enter <strong>${escapeHtml(input.to)}</strong> on the sign-in page and we'll email you a one-time link.`,
    ],
    cta: { label: "Get started", url: loginUrl },
    footnote: `Use this same address — your invitation is tied to it.`,
  });
}

export async function sendMagicLinkEmail(input: { to: string; url: string }): Promise<boolean> {
  const subject = "Your AfterFlight sign-in link";
  const text = [
    `Click to sign in to AfterFlight:`,
    input.url,
    ``,
    `This link expires in 15 minutes. If you didn't request it, you can ignore this email.`,
  ].join("\n");

  return send("magic link", input.to, subject, text, {
    preheader: "Your one-time link, good for 15 minutes.",
    heading: "Sign in to AfterFlight",
    body: [`Here's your one-time sign-in link. No password required.`],
    cta: { label: "Sign in", url: input.url },
    footnote: `This link expires in 15 minutes and can only be used once. If you didn't request it, you can safely ignore this email — nobody can sign in without it.`,
  });
}

export async function sendSignupLinkEmail(input: { to: string; url: string; name: string }): Promise<boolean> {
  const subject = "Confirm your AfterFlight account";
  const text = [
    `Hi ${firstName(input.name)},`,
    ``,
    `Click to confirm your AfterFlight account and set up your organization:`,
    input.url,
    ``,
    `This link expires in 15 minutes. If you didn't request it, you can ignore this email.`,
  ].join("\n");

  return send("signup link", input.to, subject, text, {
    preheader: "One click to confirm, then you're set up.",
    heading: "Confirm your AfterFlight account",
    body: [
      `Hi ${escapeHtml(firstName(input.name))},`,
      `Confirm this address and we'll finish setting up your account. It takes one click — there's no password to create.`,
    ],
    cta: { label: "Confirm and continue", url: input.url },
    footnote: `This link expires in 15 minutes. If you didn't sign up for AfterFlight, you can ignore this email.`,
  });
}

export async function sendEmailChangeEmail(input: { to: string; url: string }): Promise<boolean> {
  const subject = "Confirm your new AfterFlight email";
  const text = [
    `Confirm this address as your new AfterFlight sign-in email:`,
    input.url,
    ``,
    `This link expires in 15 minutes. If you didn't request this, you can ignore this email -- your AfterFlight sign-in email won't change.`,
  ].join("\n");

  return send("email-change link", input.to, subject, text, {
    preheader: "Confirm this address to finish the change.",
    heading: "Confirm your new email",
    body: [
      `You asked to use <strong>${escapeHtml(input.to)}</strong> as your AfterFlight sign-in address. Confirm it below and it takes effect right away.`,
    ],
    cta: { label: "Confirm new email", url: input.url },
    footnote: `This link expires in 15 minutes. If you didn't request this, ignore this email — your sign-in address won't change.`,
  });
}
