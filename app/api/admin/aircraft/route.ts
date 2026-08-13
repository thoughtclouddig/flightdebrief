import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";

interface AddAircraftBody {
  tailNumber: string;
  make: string;
  model: string;
  homeAirport: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as AddAircraftBody;
  if (!body.tailNumber?.trim() || !body.make?.trim() || !body.model?.trim()) {
    return NextResponse.json({ error: "Missing tail number, make, or model" }, { status: 400 });
  }

  const repo = getRepository();
  const viewer = await getViewer();

  const aircraft = await repo.getOrCreateAircraft({
    tailNumber: body.tailNumber.trim(),
    type: `${body.make.trim()} ${body.model.trim()}`.trim(),
    homeAirport: body.homeAirport?.trim() ?? "",
    organizationId: viewer.organization.id,
  });

  return NextResponse.json({ aircraft });
}
