import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { authorize } from "@/lib/auth/guard";
import * as store from "@/lib/auth/store";
import type { CertificateType } from "@/lib/types";

interface UpdateMemberBody {
  memberId: string;
  status?: "active" | "inactive";
  certificateType?: CertificateType | null;
}

export async function PATCH(request: Request) {
  const auth = await authorize("admin");
  if (auth.response) return auth.response;

  const body = (await request.json()) as UpdateMemberBody;
  if (!body.memberId || (!body.status && body.certificateType === undefined)) {
    return NextResponse.json({ error: "Missing memberId, and status or certificateType" }, { status: 400 });
  }
  // authorize("admin") only proves the caller is an admin of *some* org --
  // without this the route acted on any membership id in the system, so an
  // admin of one school could deactivate a member of another.
  const membership = await store.getMembershipById(body.memberId);
  if (!membership || membership.organizationId !== auth.viewer.organization.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Deactivating your own membership is how you lock yourself out of your own
  // organization -- getViewer resolves the first *active* membership, so an
  // independent CFI (who is the only member) would have no way back in.
  if (body.status === "inactive" && membership.userId === auth.viewer.user.id) {
    return NextResponse.json({ error: "You can't deactivate your own membership." }, { status: 400 });
  }

  const repo = getRepository();
  // Update both stores -- Postgres (lib/auth/store.ts) is the source of truth
  // for role/status used by getViewer(); the repository mirrors it for
  // roster/flight views. Shared membership ids keep them in sync.
  if (body.status) {
    await repo.setMemberStatus(body.memberId, body.status);
    await store.setMembershipStatus(body.memberId, body.status);
  }
  if (body.certificateType !== undefined) {
    await repo.setMemberCertificateType(body.memberId, body.certificateType);
    await store.setMembershipCertificateType(body.memberId, body.certificateType);
  }
  return NextResponse.json({ ok: true });
}
