import { NextResponse, type NextRequest } from "next/server";
import * as client from "openid-client";
import { getOidcConfig, requestOrigin } from "@/lib/auth/replit";
import { createSessionJwt, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { resolveUserOnLogin } from "@/lib/auth/store";

/** Completes the Replit Auth OIDC flow and establishes the app session. */
export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);
  const codeVerifier = request.cookies.get("fb_pkce")?.value;
  const expectedState = request.cookies.get("fb_state")?.value;

  if (!codeVerifier || !expectedState) {
    return NextResponse.redirect(`${origin}/login?error=expired`);
  }

  try {
    const config = await getOidcConfig();
    // Rebuild the callback URL on the external origin -- behind the Replit
    // proxy request.url may carry the internal host.
    const currentUrl = new URL(request.url);
    const externalUrl = new URL(`${origin}/api/auth/callback${currentUrl.search}`);

    const tokens = await client.authorizationCodeGrant(config, externalUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedState,
    });

    const claims = tokens.claims();
    if (!claims?.sub) throw new Error("No subject in ID token.");

    const session = {
      sub: claims.sub,
      email: typeof claims.email === "string" ? claims.email : null,
      name:
        [claims.first_name, claims.last_name].filter((v) => typeof v === "string" && v).join(" ") ||
        (typeof claims.username === "string" ? claims.username : null),
    };

    const user = await resolveUserOnLogin(session);
    if (!user) {
      const response = NextResponse.redirect(`${origin}/login?error=not-invited`);
      response.cookies.delete("fb_pkce");
      response.cookies.delete("fb_state");
      return response;
    }

    const jwt = await createSessionJwt(session);
    const response = NextResponse.redirect(`${origin}/app`);
    response.cookies.delete("fb_pkce");
    response.cookies.delete("fb_state");
    response.cookies.set(SESSION_COOKIE, jwt, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (err) {
    console.error("Replit Auth callback failed:", err);
    return NextResponse.redirect(`${origin}/login?error=auth-failed`);
  }
}
