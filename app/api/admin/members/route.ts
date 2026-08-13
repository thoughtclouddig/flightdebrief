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
