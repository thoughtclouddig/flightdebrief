import { NextResponse } from "next/server";
import { getFlightDataProvider } from "@/lib/flight-data";
import { getRepository } from "@/lib/data";
import { authorize } from "@/lib/auth/guard";

interface CreateFlightBody {
  tailNumber: string;
  aircraftType?: string;
  departureAirport: string;
  arrivalAirport: string;
  flightDate: string;
  durationMinutes: number;
  instructorName?: string;
  providerFlightId?: string | null;
}

export async function POST(request: Request) {
  const auth = await authorize();
  if (auth.response) return auth.response;
  const viewer = auth.viewer;

  const body = (await request.json()) as CreateFlightBody;

  if (!body.tailNumber || !body.departureAirport || !body.arrivalAirport || !body.flightDate || !body.durationMinutes) {
    return NextResponse.json({ error: "Missing required flight fields" }, { status: 400 });
  }

  const repo = getRepository();

  const aircraft = await repo.getOrCreateAircraft({
    tailNumber: body.tailNumber,
    type: body.aircraftType ?? "Unknown",
    homeAirport: body.departureAirport,
    organizationId: viewer.organization.id,
  });

  const instructor = body.instructorName?.trim()
    ? await repo.getOrCreateInstructor(body.instructorName.trim(), viewer.organization.id)
    : null;

  let track = null;
  if (body.providerFlightId) {
    try {
      track = await getFlightDataProvider().getFlightTrack(body.providerFlightId);
    } catch (err) {
      console.error("[Flights] failed to fetch track for", body.providerFlightId, err);
    }
  }

  const flight = await repo.createFlight({
    aircraftId: aircraft.id,
    organizationId: viewer.organization.id,
    studentId: viewer.user.id,
    departureAirport: body.departureAirport.toUpperCase(),
    arrivalAirport: body.arrivalAirport.toUpperCase(),
    flightDate: body.flightDate,
    durationMinutes: body.durationMinutes,
    instructorId: instructor?.id ?? null,
    fr24FlightId: body.providerFlightId ?? null,
    track,
  });

  return NextResponse.json({ flight });
}
