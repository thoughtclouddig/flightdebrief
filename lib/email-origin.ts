/**
 * Server-controlled public origin for links in outgoing email. Never derived
 * from request headers -- forwarded-host values are attacker-influenceable
 * and would end up as phishing links in real inboxes. REPLIT_DOMAINS holds
 * the deployment's domain in production and the dev domain in the workspace.
 *
 * Lives here rather than in lib/email.ts so the email layout can use it
 * without a circular import; lib/email.ts re-exports it, which is where the
 * rest of the app (sitemap, metadata, Stripe return URLs) imports it from.
 */
export function appOrigin(): string | null {
  const configured = process.env.APP_BASE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  return domain ? `https://${domain}` : null;
}
