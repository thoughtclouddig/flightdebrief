import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";

interface CreateReservationBody {
  studentId: string;
  aircraftId: string;
  scheduledStart: string;
  scheduledEnd: string;
}

/**
 * App-originated reservation scheduling -- see the doc comment on
 * Repository.createReservation. Instructor/admin only; the calling CFI is
 * always the reservation's instructor (scheduling on behalf of a colleague
 * is out of scope for this pass). Disabled for school orgs -- they're the
 * ones actually running Flight Schedule Pro today, and a second, unsynced
 * scheduler there risks two systems drifting out of sync (see
 * components/student-training-detail.tsx's canScheduleLessons, which hides
 * the button; this is the server-side half of that same rule).
 */
export async function POST(request: Request) {
  const auth = await authorize(["instructor", "admin"]);
  if (auth.response) return auth.response;
  const viewer = auth.viewer;
  if (viewer.organization.kind === "school") {
    return NextResponse.json({ error: "Not available for this organization." }, { status: 403 });
  }

  const body = (await request.json()) as CreateReservationBody;
  if (!body.studentId || !body.aircraftId || !body.scheduledStart || !body.scheduledEnd) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (new Date(body.scheduledEnd).getTime() <= new Date(body.scheduledStart).getTime()) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }

  const repo = getRepository();
  const student = await repo.getUser(body.studentId);
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const memberships = await repo.listMembershipsForUser(student.id);
  if (!memberships.some((m) => m.organizationId === viewer.organization.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const aircraft = await repo.getAircraft(body.aircraftId);
  if (!aircraft || aircraft.organizationId !== viewer.organization.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const reservation = await repo.createReservation({
    organizationId: viewer.organization.id,
    studentId: student.id,
    instructorId: viewer.user.id,
    aircraftId: aircraft.id,
    scheduledStart: body.scheduledStart,
    scheduledEnd: body.scheduledEnd,
  });

  return NextResponse.json({ reservation });
}
