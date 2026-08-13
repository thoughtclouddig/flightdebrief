import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";

interface SetDoneBody {
  done: boolean;
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/training-items/[id]">) {
  const { id } = await params;
  const body = (await request.json()) as SetDoneBody;
  if (typeof body.done !== "boolean") {
    return NextResponse.json({ error: "Missing done" }, { status: 400 });
  }

  const repo = getRepository();
  await repo.setTrainingItemDone(id, body.done);

  return NextResponse.json({ ok: true });
}
