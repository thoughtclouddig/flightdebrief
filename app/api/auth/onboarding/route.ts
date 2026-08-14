import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { completeProfile } from "@/lib/auth/store";

/** One-time profile completion after first magic-link login. */
export async function POST(request: Request) {
  const auth = await authorize(undefined, { allowIncompleteProfile: true });
  if (auth.response) return auth.response;

  let name: string | undefined;
  try {
    name = (await request.json())?.name;
  } catch {
    /* fall through to validation */
  }
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed || trimmed.length > 120) {
    return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  }

  await completeProfile(auth.viewer.user.id, trimmed);
  return NextResponse.json({ ok: true });
}
