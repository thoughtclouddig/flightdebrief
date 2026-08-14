import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/auth/origin";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { appOrigin } from "@/lib/email";

/** Clears the app session cookie. */
export async function GET(request: NextRequest) {
  const origin = appOrigin() ?? requestOrigin(request);
  const response = NextResponse.redirect(`${origin}/`);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
