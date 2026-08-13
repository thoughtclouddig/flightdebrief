import { NextResponse, type NextRequest } from "next/server";
import * as client from "openid-client";
import { getOidcConfig, requestOrigin } from "@/lib/auth/replit";

/** Starts the Replit Auth OIDC flow (PKCE public client). */
export async function GET(request: NextRequest) {
  const config = await getOidcConfig();
  const origin = requestOrigin(request);

  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();

  const authUrl = client.buildAuthorizationUrl(config, {
    redirect_uri: `${origin}/api/auth/callback`,
    scope: "openid email profile offline_access",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "login consent",
  });

  const response = NextResponse.redirect(authUrl);
  const cookieOpts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: 600 };
  response.cookies.set("fb_pkce", codeVerifier, cookieOpts);
  response.cookies.set("fb_state", state, cookieOpts);
  return response;
}
