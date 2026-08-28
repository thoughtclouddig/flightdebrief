import { NextResponse } from "next/server";
import { authorize, recordNotFound } from "@/lib/auth/guard";
import { getRepository } from "@/lib/data";
import type { UpdateAircraftInput } from "@/lib/data/types";

interface PatchBody {
  tailNumber?: string;
  make?: string;
  model?: string;
  homeAirport?: string;
  status?: "active" | "inactive" | "maintenance";
}

const STATUSES = new Set(["active", "inactive", "maintenance"]);

/**
 * Shared guard: the aircraft must exist and belong to the caller's own org.
 * Aircraft have no studentId so canAccessRecord doesn't apply -- this is the
 * straight org check, which also means a shared//imported aircraft with a null
 * organizationId is never editable from an admin screen.
 */
async function loadOwned(id: string, organizationId: string) {
  const repo = getRepository();
  const aircraft = await repo.getAircraft(id);
  if (!aircraft || aircraft.organizationId !== organizationId) return null;
  return { aircraft, repo };
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/aircraft/[id]">) {
  const auth = await authorize("admin");
  if (auth.response) return auth.response;

  const { id } = await params;
  const owned = await loadOwned(id, auth.viewer.organization.id);
  if (!owned) return recordNotFound();

  const body = (await request.json()) as PatchBody;
  const update: UpdateAircraftInput = {};

  if (body.tailNumber !== undefined) {
    if (!body.tailNumber.trim()) {
      return NextResponse.json({ error: "Tail number can't be empty." }, { status: 400 });
    }
    update.tailNumber = body.tailNumber;
  }
  if (body.make !== undefined) {
    if (!body.make.trim()) return NextResponse.json({ error: "Make can't be empty." }, { status: 400 });
    update.make = body.make;
  }
  if (body.model !== undefined) update.model = body.model;
  if (body.homeAirport !== undefined) update.homeAirport = body.homeAirport;
  if (body.status !== undefined) {
    if (!STATUSES.has(body.status)) return NextResponse.json({ error: "Unknown status." }, { status: 400 });
    update.status = body.status;
  }

  try {
    const aircraft = await owned.repo.updateAircraft(id, update);
    if (!aircraft) return recordNotFound();
    return NextResponse.json({ aircraft });
  } catch (err) {
    // aircraft_tail_number_idx is unique on upper(tail_number), so renaming
    // onto another aircraft's tail is a 23505 rather than a validation error
    // we could catch above -- the clash may be with a row in another org.
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return NextResponse.json({ error: "That tail number is already registered." }, { status: 409 });
    }
    throw err;
  }
}

/**
 * Hard delete, refused once the aircraft has flown. See
 * Repository.deleteAircraft -- flights are ON DELETE RESTRICT, so history is
 * never silently destroyed; the caller is told to mark it inactive instead.
 */
export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/aircraft/[id]">) {
  const auth = await authorize("admin");
  if (auth.response) return auth.response;

  const { id } = await params;
  const owned = await loadOwned(id, auth.viewer.organization.id);
  if (!owned) return recordNotFound();

  const result = await owned.repo.deleteAircraft(id);
  if (!result.deleted) {
    return NextResponse.json(
      {
        error: `This aircraft has ${result.flightCount} logged flight${result.flightCount === 1 ? "" : "s"}. Mark it inactive instead -- deleting it would take that training history with it.`,
        reason: result.reason,
      },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true, cancelledReservations: result.cancelledReservations });
}
