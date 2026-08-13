import { NextResponse, type NextRequest } from "next/server";
import * as client from "openid-client";
import { getOidcConfig, requestOrigin } from "@/lib/auth/replit";
import { SESSION_COOKIE } from "@/lib/auth/session";

/** Clears the app session and signs the user out of Replit Auth. */
export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);

  let redirectTo = `${origin}/`;
  try {
    const config = await getOidcConfig();
    redirectTo = client
      .buildEndSessionUrl(config, {
        client_id: process.env.REPL_ID ?? "",
        post_logout_redirect_uri: `${origin}/`,
      })
      .href;
  } catch {
    // If discovery fails, still clear the local session and go home.
  }

  const response = NextResponse.redirect(redirectTo);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
