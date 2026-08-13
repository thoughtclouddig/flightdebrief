import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import type { CertificateType } from "@/lib/types";

interface UpdateMemberBody {
  memberId: string;
  status?: "active" | "inactive";
  certificateType?: CertificateType | null;
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as UpdateMemberBody;
  if (!body.memberId || (!body.status && body.certificateType === undefined)) {
    return NextResponse.json({ error: "Missing memberId, and status or certificateType" }, { status: 400 });
  }
  const repo = getRepository();
  if (body.status) await repo.setMemberStatus(body.memberId, body.status);
  if (body.certificateType !== undefined) await repo.setMemberCertificateType(body.memberId, body.certificateType);
  return NextResponse.json({ ok: true });
}
