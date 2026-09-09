import { NextResponse } from "next/server";
import { getFlightDataProvider, isMockProviderFlightId } from "@/lib/flight-data";
import { getRepository } from "@/lib/data";
import { authorize } from "@/lib/auth/guard";
import { isDevelopment } from "@/lib/env";
import { nearestKnownAirport } from "@/lib/geo";

interface CreateFlightBody {
  tailNumber: string;
  aircraftType?: string;
  departureAirport: string;
  arrivalAirport: string;
  flightDate: string;
  durationMinutes: number;
  instructorName?: string;
  providerFlightId?: string | null;
  /** Instructor/admin only -- lets a CFI log a flight for one of their students instead of themselves. */
  studentId?: string;
}

export async function POST(request: Request) {
  const auth = await authorize();
  if (auth.response) return auth.response;
  const viewer = auth.viewer;

  const body = (await request.json()) as CreateFlightBody;

  // Airport codes are allowed to come back empty -- FR24 doesn't always resolve
  // an ICAO code (e.g. private strips, data gaps), and that shouldn't block
  // logging a real flight. tailNumber/flightDate/durationMinutes are the only
  // fields the rest of the app actually depends on being present.
  if (!body.tailNumber || !body.flightDate || !body.durationMinutes) {
    return NextResponse.json({ error: "Missing required flight fields" }, { status: 400 });
  }
  // Left un-finalized (not yet "UNKNOWN") until after the track fetch below --
  // a real track can resolve one of these even when FR24's own summary
  // couldn't (see nearestKnownAirport's doc comment).
  const rawDepartureAirport = body.departureAirport?.trim() ?? "";
  const rawArrivalAirport = body.arrivalAirport?.trim() ?? "";

  const repo = getRepository();

  // A CFI/admin logging a flight for a specific student -- the person doing
  // the logging becomes the instructor of record by default (see below), no
  // separate instructor picker needed for this path.
  let studentId = viewer.user.id;
  let loggedByInstructor = false;
  if (body.studentId && body.studentId !== viewer.user.id) {
    if (viewer.role !== "instructor" && viewer.role !== "admin") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const student = await repo.getUser(body.studentId);
    if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const memberships = await repo.listMembershipsForUser(student.id);
    if (!memberships.some((m) => m.organizationId === viewer.organization.id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    studentId = student.id;
    loggedByInstructor = true;
  }

  try {
    // A mock-provider id reaching this route outside Development can only be
    // a stale/replayed request (search never returns one there since
    // getFlightDataProvider() itself returns null) -- treat it as no lookup
    // at all rather than let a field named fr24FlightId ever represent a
    // mock result in a real environment.
    const providerFlightId =
      body.providerFlightId && (isDevelopment() || !isMockProviderFlightId(body.providerFlightId)) ? body.providerFlightId : null;

    let track = null;
    if (providerFlightId) {
      const provider = getFlightDataProvider();
      if (provider) {
        try {
          track = await provider.getFlightTrack(providerFlightId);
        } catch (err) {
          console.error("[Flights] failed to fetch track for", providerFlightId, err);
        }
      }
    }

    // Real telemetry, not a guess: only consulted when FR24's own summary
    // left a side blank, and only ever names an airport the flight's actual
    // first/last plotted position places it at (see nearestKnownAirport).
    // Never fires for a genuinely distant/unknown position -- it falls
    // through to the same honest "UNKNOWN" as before.
    const departureAirport = (
      rawDepartureAirport ||
      (track?.length ? nearestKnownAirport(track[0].lat, track[0].lon) : null) ||
      "UNKNOWN"
    ).toUpperCase();
    const arrivalAirport = (
      rawArrivalAirport ||
      (track?.length ? nearestKnownAirport(track[track.length - 1].lat, track[track.length - 1].lon) : null) ||
      "UNKNOWN"
    ).toUpperCase();

    const aircraft = await repo.getOrCreateAircraft({
      tailNumber: body.tailNumber,
      type: body.aircraftType ?? "Unknown",
      homeAirport: departureAirport,
      organizationId: viewer.organization.id,
    });

    const instructorName = loggedByInstructor ? viewer.user.name : body.instructorName?.trim();
    const instructor = instructorName
      ? await repo.getOrCreateInstructor(instructorName, viewer.organization.id)
      : null;

    const flight = await repo.createFlight({
      aircraftId: aircraft.id,
      organizationId: viewer.organization.id,
      studentId,
      departureAirport,
      arrivalAirport,
      flightDate: body.flightDate,
      durationMinutes: body.durationMinutes,
      instructorId: instructor?.id ?? null,
      fr24FlightId: providerFlightId,
      track,
    });

    return NextResponse.json({ flight });
  } catch (err) {
    console.error("[Flights] failed to create flight:", err);
    return NextResponse.json({ error: "Failed to create flight. Please try again." }, { status: 502 });
  }
}
