import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { getFlightDataProvider } from "@/lib/flight-data";

export async function GET(request: Request) {
  const auth = await authorize();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const tail = searchParams.get("tail")?.trim() ?? "";
  if (!tail) {
    return NextResponse.json({ error: "Missing tail number" }, { status: 400 });
  }

  const provider = getFlightDataProvider();
  try {
    const candidates = await provider.searchFlightsByTailNumber(tail);
    return NextResponse.json({ provider: provider.name, candidates });
  } catch (err) {
    console.error(`[flights/search] ${provider.name} lookup failed for ${tail}:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Flight data provider request failed" },
      { status: 502 },
    );
  }
}
