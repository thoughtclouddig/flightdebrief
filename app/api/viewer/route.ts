import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { VIEWER_COOKIE_NAME } from "@/lib/viewer";
import type { OrgRole } from "@/lib/types";

interface SetViewerBody {
  userId: string;
  organizationId: string;
  role: OrgRole;
}

export async function POST(request: Request) {
  const body = (await request.json()) as SetViewerBody;
  if (!body.userId || !body.organizationId || !body.role) {
    return NextResponse.json({ error: "Missing userId, organizationId, or role" }, { status: 400 });
  }

  const store = await cookies();
  store.set(VIEWER_COOKIE_NAME, JSON.stringify(body), {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ ok: true });
}
