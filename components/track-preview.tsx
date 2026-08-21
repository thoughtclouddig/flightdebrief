import type { TrackPosition } from "@/lib/types";

/** Lightweight SVG track renderer used while the interactive map is deferred. */
export function TrackPreview({ track }: { track: TrackPosition[] }) {
  const lats = track.map((p) => p.lat);
  const lons = track.map((p) => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const padding = 0.15;
  const latRange = Math.max(maxLat - minLat, 0.0005);
  const lonRange = Math.max(maxLon - minLon, 0.0005);
  const width = 640;
  const height = 360;

  const project = (p: TrackPosition) => {
    const x = ((p.lon - minLon) / lonRange) * width * (1 - padding * 2) + width * padding;
    // lat increases upward, svg y increases downward
    const y = height - (((p.lat - minLat) / latRange) * height * (1 - padding * 2) + height * padding);
    return [x, y] as const;
  };

  const points = track.map(project);
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [startX, startY] = points[0];
  const [endX, endY] = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
      <defs>
        <linearGradient id="trackFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-light)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--color-brand-light)" stopOpacity="0" />
        </linearGradient>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0H0V32" fill="none" stroke="currentColor" strokeOpacity="0.08" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#grid)" />
      <path d={`${path} L${endX},${height} L${startX},${height} Z`} fill="url(#trackFade)" />
      <path d={path} fill="none" stroke="var(--color-brand)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={startX} cy={startY} r={6} fill="var(--color-brand)" stroke="white" strokeWidth={2} />
      <circle cx={endX} cy={endY} r={6} fill="#101727" stroke="white" strokeWidth={2} />
    </svg>
  );
}
