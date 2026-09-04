import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompareAttemptsScreen } from "@/components/student/flights/compare-attempts";
import { FLIGHTS, flightById } from "@/lib/prototype-fixtures/flights";
import { analysisFor } from "@/lib/prototype/moments";
import { compareSegments } from "@/lib/student/telemetry";
import { ACS_AREAS } from "@/lib/prototype-fixtures/vector-data";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return FLIGHTS.filter((f) => analysisFor(f.id)).map((f) => ({ id: f.id }));
}

/** Milestone 1B fixture-parity Compare Attempts -- mechanically the same as app/prototype/vector/flights/[id]/compare/page.tsx, hrefs repointed at /v2/**. */
export default async function V2ComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flight = flightById(id);
  const analysis = analysisFor(id);
  if (!flight || !analysis) notFound();

  const approaches = analysis.segments.filter((s) => s.type === "APPROACH");
  const a = approaches.find((s) => s.id === "approach-2") ?? approaches[0];
  const b = approaches.find((s) => s.id === "approach-3") ?? approaches[approaches.length - 1];
  if (!a || !b || a.id === b.id) notFound();

  const rows = compareSegments(analysis.telemetry, a, b);
  const momentB = analysis.moments.find((m) => m.segmentId === b.id);

  const pts = analysis.telemetry.points;

  const shown = [...pts.slice(a.startIndex, a.endIndex + 1), ...pts.slice(b.startIndex, b.endIndex + 1)];
  const lats = shown.map((p) => p.lat);
  const lons = shown.map((p) => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const PAD = 18;
  const BOX_W = 300;
  const BOX_H = 200;
  const innerW = BOX_W - PAD * 2;
  const innerH = BOX_H - PAD * 2;

  const lonScale = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
  const spanX = Math.max((maxLon - minLon) * lonScale, 1e-9);
  const spanY = Math.max(maxLat - minLat, 1e-9);
  const scale = Math.min(innerW / spanX, innerH / spanY);

  const offsetX = PAD + (innerW - spanX * scale) / 2;
  const offsetY = PAD + (innerH - spanY * scale) / 2;

  const x = (lon: number) => offsetX + (lon - minLon) * lonScale * scale;
  const y = (lat: number) => offsetY + (maxLat - lat) * scale;
  const path = (s: typeof a) =>
    pts
      .slice(s.startIndex, s.endIndex + 1)
      .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.lon).toFixed(1)},${y(p.lat).toFixed(1)}`)
      .join(" ");

  return (
    <CompareAttemptsScreen
      backHref={`/v2/flights/${id}/analysis`}
      kicker={`${flight.dateLabel} · ${flight.lesson}`}
      aLabel={a.label}
      bLabel={b.label}
      pathA={path(a)}
      pathB={path(b)}
      rows={rows}
      instructorEvidence={momentB?.instructorEvidence ?? null}
      vectorText={`Based on the available flight data, ${b.label.toLowerCase()} appears to have settled earlier and needed fewer corrections near the runway. That lines up with what ${flight.instructor?.split(" ")[0] ?? "your instructor"} said about it.`}
      trainHref="/v2/train"
      replayHrefA={`/v2/flights/${id}/replay?t=${Math.round(a.startT)}`}
      replayHrefB={`/v2/flights/${id}/replay?t=${Math.round(b.startT)}`}
      acsArea={ACS_AREAS.landings}
      acsCode="PA.IV.B"
    />
  );
}
