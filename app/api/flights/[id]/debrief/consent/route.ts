import { NextResponse } from "next/server";
import { authorize, canAccessRecord, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";

interface ConsentBody {
  status: "granted" | "declined";
}

/**
 * Recording consent (V1 change 12) -- called before either recorder starts.
 * Records consent for the signed-in participant only; the app has no
 * dual-device signing flow today, so this represents "the person running the
 * recorder acknowledges on behalf of the session," not a per-device signature
 * from both parties.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize();
  if (auth.response) return auth.response;

  const { id } = await params;
  const repo = getRepository();
  const flight = await repo.getFlight(id);
  if (!flight || !canAccessRecord(auth.viewer, { studentId: flight.userId, organizationId: flight.organizationId })) {
    return recordNotFound();
  }

  const body = (await request.json()) as ConsentBody;
  if (body.status !== "granted" && body.status !== "declined") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const participantRole = auth.viewer.role === "student" ? "student" : "instructor";
  const record = await repo.createConsentRecord({
    flightId: id,
    participantUserId: auth.viewer.user.id,
    participantRole,
    status: body.status,
  });

  return NextResponse.json({ consent: record });
}
