import { NextResponse } from "next/server";
import { resetVideoDemoFlight } from "@/lib/demo/video-demo-seed";

/** Called by components/demo/demo-control-panel.tsx's Reset button. Same REPLIT_DEPLOYMENT gate as app/api/demo/enter/route.ts. */
export async function POST() {
  if (process.env.REPLIT_DEPLOYMENT) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  try {
    await resetVideoDemoFlight();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[demo] reset failed:", err);
    return NextResponse.json({ error: "Reset failed." }, { status: 500 });
  }
}
