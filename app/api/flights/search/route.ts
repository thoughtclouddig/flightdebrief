import { NextResponse } from "next/server";
import { getFlightDataProvider } from "@/lib/flight-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tail = searchParams.get("tail")?.trim() ?? "";
  if (!tail) {
    return NextResponse.json({ error: "Missing tail number" }, { status: 400 });
  }

  const provider = getFlightDataProvider();
  const candidates = await provider.searchFlightsByTailNumber(tail);
  return NextResponse.json({ provider: provider.name, candidates });
}
