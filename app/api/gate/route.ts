import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/auth/origin";
import { checkSiteAccessCode, createSiteGateJwt, SITE_GATE_COOKIE, SITE_GATE_MAX_AGE_SECONDS } from "@/lib/auth/session";

function safeNext(request: NextRequest): string {
  const next = request.nextUrl.searchParams.get("next") ?? "/";
  // Only ever redirect back into this same site -- never an attacker-supplied absolute URL.
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function POST(request: NextRequest) {
  // requestOrigin(), not lib/email.ts's appOrigin() -- this is a same-request
  // redirect and must stay on whatever host served the request (dev workspace
  // or production), not get bounced to the pinned production APP_BASE_URL.
  const origin = requestOrigin(request);
  const form = await request.formData();
  const code = String(form.get("code") ?? "");
  const next = safeNext(request);

  if (!checkSiteAccessCode(code)) {
    const gateUrl = new URL("/gate", origin);
    gateUrl.searchParams.set("next", next);
    gateUrl.searchParams.set("error", "1");
    return NextResponse.redirect(gateUrl);
  }

  const jwt = await createSiteGateJwt();
  const response = NextResponse.redirect(new URL(next, origin));
  if (jwt) {
    response.cookies.set(SITE_GATE_COOKIE, jwt, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SITE_GATE_MAX_AGE_SECONDS,
    });
  }
  return response;
}
