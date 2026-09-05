import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/auth/origin";
import { isDevelopment } from "@/lib/env";
import { V2_REAL_DATA_COOKIE } from "@/lib/auth/session";

/**
 * Development-only toggle: sets the cookie that makes /v2 render the real,
 * already-signed-in Student's own data instead of the Mia/Jake fixture
 * reference. Mints no session and seeds no data -- it only changes how /v2
 * reads whatever real session already exists (e.g. from
 * /api/demo/start?persona=pilot). 404s outside development so this can never
 * matter in staging or production; lib/env.ts's v2RealDataMode() ignores
 * this cookie in both regardless, this is the second, independent guard.
 */
export async function GET(request: NextRequest) {
  if (!isDevelopment()) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }
  const origin = requestOrigin(request);
  const response = NextResponse.redirect(`${origin}/v2`);
  response.cookies.set(V2_REAL_DATA_COOKIE, "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
