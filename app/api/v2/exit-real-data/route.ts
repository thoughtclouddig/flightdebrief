import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/auth/origin";
import { isDevelopment } from "@/lib/env";
import { V2_REAL_DATA_COOKIE } from "@/lib/auth/session";

/** Clears the real-data toggle from app/api/v2/enter-real-data/route.ts, back to the fixture reference -- see that file's own doc comment. */
export async function GET(request: NextRequest) {
  if (!isDevelopment()) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }
  const origin = requestOrigin(request);
  const response = NextResponse.redirect(`${origin}/v2`);
  response.cookies.delete(V2_REAL_DATA_COOKIE);
  return response;
}
