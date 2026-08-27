import { NextResponse } from "next/server";
import { authorize, canAccessRecord, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";

interface PatchBody {
  done?: boolean;
  /** CFI-only -- see the role check below. Editing wording an AI generated, or one they typed themselves. */
  description?: string;
}

async function loadAuthorizedItem(id: string, viewer: Awaited<ReturnType<typeof authorize>>["viewer"]) {
  const repo = getRepository();
  const item = (await repo.listTrainingItems()).find((t) => t.id === id);
  if (!item) return null;

  const flight = await repo.getFlight(item.flightId);
  if (!flight || !viewer || !canAccessRecord(viewer, { studentId: flight.userId, organizationId: flight.organizationId })) {
    return null;
  }
  return { item, repo };
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/training-items/[id]">) {
  const auth = await authorize();
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = (await request.json()) as PatchBody;
  if (typeof body.done !== "boolean" && typeof body.description !== "string") {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const authorized = await loadAuthorizedItem(id, auth.viewer);
  if (!authorized) return recordNotFound();
  const { repo } = authorized;

  if (typeof body.description === "string") {
    // Editing an item's wording is a CFI action -- a student can still
    // toggle "done" on their own items (existing behavior, untouched below).
    if (auth.viewer.role !== "instructor" && auth.viewer.role !== "admin") {
      return NextResponse.json({ error: "Only an instructor can edit this" }, { status: 403 });
    }
    const trimmed = body.description.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Description can't be empty" }, { status: 400 });
    }
    await repo.updateTrainingItemDescription(id, trimmed);
  }

  if (typeof body.done === "boolean") {
    await repo.setTrainingItemDone(id, body.done);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/training-items/[id]">) {
  const auth = await authorize(["instructor", "admin"]);
  if (auth.response) return auth.response;

  const { id } = await params;
  const authorized = await loadAuthorizedItem(id, auth.viewer);
  if (!authorized) return recordNotFound();

  await authorized.repo.deleteTrainingItem(id);
  return NextResponse.json({ ok: true });
}
