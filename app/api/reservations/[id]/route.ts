import { NextResponse } from "next/server";
import { authorize, canAccessRecord, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import type { UpdateReservationInput } from "@/lib/data/types";

interface PatchBody {
  scheduledStart?: string;
  scheduledEnd?: string;
  aircraftId?: string;
  instructorId?: string;
}

/**
 * Shared guard: the reservation must exist and belong to the caller's own
 * org. Reuses canAccessRecord so rescheduling follows the same org-scoped
 * rule as everything else a CFI can touch (see lib/auth/guard.ts) -- any
 * instructor at the school can fix a booking, not only whoever created it,
 * which is the point when someone calls in sick.
 */
async function loadAuthorized(id: string, viewer: Awaited<ReturnType<typeof authorize>>["viewer"]) {
  const repo = getRepository();
  const reservation = await repo.getReservation(id);
  if (!reservation || !viewer) return null;
  if (!canAccessRecord(viewer, { studentId: reservation.studentId, organizationId: reservation.organizationId })) {
    return null;
  }
  return { reservation, repo };
}

/** Reschedule: time, aircraft, and/or instructor. Omitted fields are left alone. */
export async function PATCH(request: Request, { params }: RouteContext<"/api/reservations/[id]">) {
  const auth = await authorize(["instructor", "admin"]);
  if (auth.response) return auth.response;
  const viewer = auth.viewer;

  const { id } = await params;
  const authorized = await loadAuthorized(id, viewer);
  if (!authorized) return recordNotFound();
  const { reservation, repo } = authorized;

  const body = (await request.json()) as PatchBody;
  const update: UpdateReservationInput = {};

  if (body.scheduledStart !== undefined || body.scheduledEnd !== undefined) {
    // Validate against the merged result, not just what was sent -- changing
    // only the start would otherwise let it slide past an untouched end.
    const start = new Date(body.scheduledStart ?? reservation.scheduledStart);
    const end = new Date(body.scheduledEnd ?? reservation.scheduledEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    if (end.getTime() <= start.getTime()) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }
    if (body.scheduledStart !== undefined) update.scheduledStart = start.toISOString();
    if (body.scheduledEnd !== undefined) update.scheduledEnd = end.toISOString();
  }

  if (body.aircraftId !== undefined) {
    const aircraft = await repo.getAircraft(body.aircraftId);
    if (!aircraft || aircraft.organizationId !== viewer.organization.id) {
      return NextResponse.json({ error: "Unknown aircraft" }, { status: 400 });
    }
    update.aircraftId = aircraft.id;
  }

  if (body.instructorId !== undefined) {
    // Same rule as POST /api/reservations: never trust a submitted instructor
    // id, or one org could schedule onto another org's CFI.
    const orgInstructors = await repo.listMembers(viewer.organization.id, "instructor");
    const match = orgInstructors.find((m) => m.userId === body.instructorId && m.status === "active");
    if (!match) return NextResponse.json({ error: "Unknown instructor" }, { status: 400 });
    update.instructorId = match.userId;
  }

  const updated = await repo.updateReservation(id, update);
  if (!updated) return recordNotFound();
  return NextResponse.json({ reservation: updated });
}

/** Cancel. Sets status "cancelled" rather than deleting -- see the repository doc comment. */
export async function DELETE(_request: Request, { params }: RouteContext<"/api/reservations/[id]">) {
  const auth = await authorize(["instructor", "admin"]);
  if (auth.response) return auth.response;

  const { id } = await params;
  const authorized = await loadAuthorized(id, auth.viewer);
  if (!authorized) return recordNotFound();

  await authorized.repo.cancelReservation(id);
  return NextResponse.json({ ok: true });
}
