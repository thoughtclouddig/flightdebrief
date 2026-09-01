import type { FlightSegment, FlightTelemetry } from "@/lib/prototype/telemetry";

/**
 * A still of one segment against the rest of the flight.
 *
 * Not interactive, and not a map. At this size a basemap is decoration; what
 * a student reads in half a second is "this part, out of the whole thing".
 * Replay is one tap away for anyone who wants to move through it.
 */
export function MomentTrack({ telemetry, segment }: { telemetry: FlightTelemetry; segment: FlightSegment }) {
  const pts = telemetry.points;
  if (pts.length < 2) return null;

  const lats = pts.map((p) => p.lat);
  const lons = pts.map((p) => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const x = (lon: number) => ((lon - minLon) / (maxLon - minLon || 1)) * 264 + 18;
  const y = (lat: number) => (1 - (lat - minLat) / (maxLat - minLat || 1)) * 144 + 18;
  const d = (from: number, to: number) =>
    pts
      .slice(from, to + 1)
      .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.lon).toFixed(1)},${y(p.lat).toFixed(1)}`)
      .join(" ");

  const start = pts[segment.startIndex]!;
  const end = pts[segment.endIndex]!;

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
      <svg viewBox="0 0 300 180" className="w-full" role="img" aria-label={`${segment.label} highlighted on the flight path`}>
        <path d={d(0, pts.length - 1)} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-hairline" />
        <path
          d={d(segment.startIndex, segment.endIndex)}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          className="text-brand"
        />
        <circle cx={x(start.lon)} cy={y(start.lat)} r={3.5} className="fill-brand" />
        <circle cx={x(end.lon)} cy={y(end.lat)} r={3.5} className="fill-brand" />
      </svg>
    </div>
  );
}
