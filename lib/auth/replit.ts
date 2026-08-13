import * as client from "openid-client";

/**
 * Replit Auth OIDC configuration. Replit provisions the client automatically:
 * the app's REPL_ID is the OIDC client id and https://replit.com/oidc is the
 * issuer (ISSUER_URL can override it for e2e testing). Public client -- PKCE,
 * no client secret.
 */
let cached: client.Configuration | null = null;

export async function getOidcConfig(): Promise<client.Configuration> {
  if (cached) return cached;
  const issuer = process.env.ISSUER_URL ?? "https://replit.com/oidc";
  const replId = process.env.REPL_ID;
  if (!replId) throw new Error("REPL_ID is not set -- Replit Auth requires it as the OIDC client id.");
  cached = await client.discovery(new URL(issuer), replId);
  return cached;
}

/** The externally-visible origin of this request (behind the Replit proxy). */
export function requestOrigin(request: Request): string {
  const headers = new Headers(request.headers);
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const proto = headers.get("x-forwarded-proto") ?? "https";
  if (!host) throw new Error("Cannot determine request host.");
  return `${proto}://${host}`;
}
