import { NextResponse } from "next/server";
import { authorize, canAccessRecord, recordNotFound } from "@/lib/auth/guard";
import { assertAssessmentRole } from "@/lib/auth/assessment-access";
import { getRepository } from "@/lib/data";
import type { PerformanceLevelCode } from "@/lib/performance-levels";

interface RateBody {
  flightTaskId: string;
  level: PerformanceLevelCode;
  note?: string | null;
}

/** Upserts one task rating within the caller's own (student or instructor) independent assessment. */
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/flights/[id]/debrief/assessments/[role]/ratings">,
) {
  const auth = await authorize();
  if (auth.response) return auth.response;

  const { id, role: roleParam } = await params;
  const repo = getRepository();
  const flight = await repo.getFlight(id);
  if (!flight || !canAccessRecord(auth.viewer, { studentId: flight.userId, organizationId: flight.organizationId })) {
    return recordNotFound();
  }

  const roleCheck = assertAssessmentRole(auth.viewer, flight, roleParam);
  if (roleCheck.response) return roleCheck.response;

  const body = (await request.json()) as RateBody;
  if (!body.flightTaskId || !body.level) {
    return NextResponse.json({ error: "Missing flightTaskId or level" }, { status: 400 });
  }

  const assessment = await repo.getOrCreateAssessment(id, roleCheck.role, auth.viewer.user.id);
  if (assessment.status === "submitted") {
    return NextResponse.json({ error: "Assessment already submitted" }, { status: 409 });
  }

  await repo.upsertAssessmentRating(assessment.id, body.flightTaskId, body.level, body.note ?? null);
  const ratings = await repo.listAssessmentRatings(assessment.id);

  return NextResponse.json({ assessment, ratings });
}
