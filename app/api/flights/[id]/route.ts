import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { authorize, canAccessRecord, recordNotFound } from "@/lib/auth/guard";

/** Deletes a flight and, via ON DELETE CASCADE, its debrief/training data. Admin-only. */
export async function DELETE(request: Request, { params }: RouteContext<"/api/flights/[id]">) {
  const auth = await authorize("admin");
  if (auth.response) return auth.response;
  const viewer = auth.viewer;

  const { id } = await params;
  const repo = getRepository();
  const flight = await repo.getFlight(id);
  if (!flight || !canAccessRecord(viewer, { studentId: flight.userId, organizationId: flight.organizationId })) {
    return recordNotFound();
  }

  await repo.deleteFlight(id);
  return NextResponse.json({ ok: true });
}
