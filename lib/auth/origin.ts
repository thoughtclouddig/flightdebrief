/**
 * The externally-visible origin of this request (behind the Replit proxy).
 * Safe for building same-request redirects only -- NEVER use this for links
 * placed in emails (forwarded headers are attacker-influenceable); emails
 * must use appOrigin() from lib/email.ts.
 */
export function requestOrigin(request: Request): string {
  const headers = new Headers(request.headers);
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const proto = headers.get("x-forwarded-proto") ?? "https";
  if (!host) throw new Error("Cannot determine request host.");
  return `${proto}://${host}`;
}
