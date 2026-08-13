import { NextResponse } from "next/server";
import { authorize, canAccessRecord, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";

interface SetDoneBody {
  done: boolean;
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/training-items/[id]">) {
  const auth = await authorize();
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = (await request.json()) as SetDoneBody;
  if (typeof body.done !== "boolean") {
    return NextResponse.json({ error: "Missing done" }, { status: 400 });
  }

  const repo = getRepository();
  const item = (await repo.listTrainingItems()).find((t) => t.id === id);
  if (!item) return recordNotFound();

  const flight = await repo.getFlight(item.flightId);
  if (!flight || !canAccessRecord(auth.viewer, { studentId: flight.userId, organizationId: flight.organizationId })) {
    return recordNotFound();
  }

  await repo.setTrainingItemDone(id, body.done);

  return NextResponse.json({ ok: true });
}
