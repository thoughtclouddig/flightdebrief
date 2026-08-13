import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { analyzeDebrief } from "@/lib/ai";
import { getRepository } from "@/lib/data";
import { classifyTrainingSignals } from "@/lib/taxonomy";

interface AnalyzeBody {
  flightId: string;
  transcript: string;
  audioDurationSeconds: number;
}

export async function POST(request: Request) {
  const auth = await authorize();
  if (auth.response) return auth.response;

  const body = (await request.json()) as AnalyzeBody;
  if (!body.flightId || !body.transcript?.trim()) {
    return NextResponse.json({ error: "Missing flightId or transcript" }, { status: 400 });
  }

  const repo = getRepository();
  const flight = await repo.getFlight(body.flightId);
  if (!flight) {
    return NextResponse.json({ error: "Flight not found" }, { status: 404 });
  }

  const previousActionItems = await getPreviousActionItems(flight.userId, flight.flightDate, flight.id);

  const { structured, analyzedWith } = await analyzeDebrief({
    transcript: body.transcript,
    flightMeta: {
      tailNumber: flight.aircraft.tailNumber,
      aircraftType: flight.aircraft.type,
      departureAirport: flight.departureAirport,
      arrivalAirport: flight.arrivalAirport,
      flightDate: flight.flightDate,
      durationMinutes: flight.durationMinutes,
      instructorName: flight.instructor?.name ?? null,
    },
    previousActionItems,
  });

  const debrief = await repo.createDebrief({
    flightId: flight.id,
    transcript: body.transcript,
    audioDurationSeconds: body.audioDurationSeconds ?? 0,
    structuredResult: structured,
    analyzedWith,
  });

  await repo.setFlightDebriefStatus(flight.id, "complete");

  await repo.createTrainingItems([
    ...structured.needsWork.map((description) => ({
      flightId: flight.id,
      debriefId: debrief.id,
      category: "keep_working_on" as const,
      description,
      done: false,
      completedAt: null,
      visibility: "shared" as const,
    })),
    ...structured.actionItems.map((description) => ({
      flightId: flight.id,
      debriefId: debrief.id,
      category: "before_next_flight" as const,
      description,
      done: false,
      completedAt: null,
      visibility: "shared" as const,
    })),
  ]);

  const signalDrafts = classifyTrainingSignals(structured);
  await repo.createTrainingSignals(
    signalDrafts.map((draft) => ({
      ...draft,
      organizationId: flight.organizationId,
      studentId: flight.userId,
      instructorId: flight.instructorId,
      aircraftId: flight.aircraftId,
      flightId: flight.id,
      debriefId: debrief.id,
      flightDate: flight.flightDate,
    })),
  );

  return NextResponse.json({ debrief });
}

async function getPreviousActionItems(studentId: string, currentFlightDate: string, currentFlightId: string) {
  const repo = getRepository();
  const flights = await repo.listFlights({ studentId });
  const priorCompleted = flights
    .filter((f) => f.id !== currentFlightId && f.debriefStatus === "complete" && f.flightDate <= currentFlightDate)
    .sort((a, b) => b.flightDate.localeCompare(a.flightDate))[0];
  if (!priorCompleted) return [];

  const items = await repo.listTrainingItems();
  return items
    .filter(
      (item) =>
        item.flightId === priorCompleted.id &&
        !item.done &&
        (item.category === "before_next_flight" || item.category === "keep_working_on"),
    )
    .map((item) => item.description);
}
