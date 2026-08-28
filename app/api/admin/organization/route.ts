import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import { isSuperadmin } from "@/lib/superadmin";

const MAX_NAME_LENGTH = 80;

/**
 * Renames the caller's own organization.
 *
 * Until this existed the name was fixed at signup with no way to change it --
 * including when it was left blank, in which case resolveSignupOnLogin derives
 * "<Owner>'s Flight School". That name is customer-visible: it's the subject
 * line of every invite email, so a typo followed every student they invited.
 *
 * Admins only. A superadmin may rename any org they're currently viewing,
 * matching the widened gate on the admin layout.
 */
export async function PATCH(request: Request) {
  const auth = await authorize();
  if (auth.response) return auth.response;
  const { viewer } = auth;

  if (viewer.role !== "admin" && !isSuperadmin(viewer.user.email)) {
    return NextResponse.json({ error: "Only an admin can rename this organization." }, { status: 403 });
  }
  if (viewer.organization.demoExpiresAt) {
    return NextResponse.json({ error: "The live demo organization can't be renamed." }, { status: 403 });
  }

  const body = (await request.json()) as { name?: string };
  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Enter a name." }, { status: 400 });
  }
  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: `Keep it under ${MAX_NAME_LENGTH} characters.` }, { status: 400 });
  }

  const organization = await getRepository().renameOrganization(viewer.organization.id, name);
  if (!organization) return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  return NextResponse.json({ organization });
}
