import { NextResponse } from "next/server";
import { authorize, canAccessRecord, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";

interface SetDismissedBody {
  dismissed: boolean;
}

/** CFI authority over AI-inferred signals (V1 change 14) -- a lightweight dismiss, not an edit form. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(["instructor", "admin"]);
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = (await request.json()) as SetDismissedBody;
  if (typeof body.dismissed !== "boolean") {
    return NextResponse.json({ error: "Missing dismissed" }, { status: 400 });
  }

  const repo = getRepository();
  const signal = (await repo.listTrainingSignals()).find((s) => s.id === id);
  if (!signal) return recordNotFound();

  if (!canAccessRecord(auth.viewer, { studentId: signal.studentId, organizationId: signal.organizationId })) {
    return recordNotFound();
  }

  await repo.setTrainingSignalDismissed(id, body.dismissed);

  return NextResponse.json({ ok: true });
}
