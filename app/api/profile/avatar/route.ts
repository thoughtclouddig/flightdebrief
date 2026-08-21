import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { updateUserAvatar } from "@/lib/auth/store";

interface UpdateAvatarBody {
  avatarDataUrl: string | null;
}

// Client resizes to a small square before upload (see components/avatar-upload.tsx);
// this is a generous ceiling against a tampered/buggy client, not the expected size.
const MAX_LENGTH = 400_000;

/** Self-service profile photo: PATCH { avatarDataUrl } (a data: URL, or null to remove). */
export async function PATCH(request: Request) {
  const auth = await authorize();
  if (auth.response) return auth.response;
  const { viewer } = auth;

  const body = (await request.json().catch(() => null)) as UpdateAvatarBody | null;
  if (!body || (body.avatarDataUrl !== null && typeof body.avatarDataUrl !== "string")) {
    return NextResponse.json({ error: "Missing avatarDataUrl" }, { status: 400 });
  }

  if (body.avatarDataUrl !== null) {
    if (body.avatarDataUrl.length > MAX_LENGTH) {
      return NextResponse.json({ error: "Image is too large" }, { status: 400 });
    }
    if (!/^data:image\/(png|jpeg|webp);base64,/.test(body.avatarDataUrl)) {
      return NextResponse.json({ error: "Unsupported image format" }, { status: 400 });
    }
  }

  await updateUserAvatar(viewer.user.id, body.avatarDataUrl);
  return NextResponse.json({ ok: true });
}
