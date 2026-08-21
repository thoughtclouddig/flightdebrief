import type { TrackPosition } from "@/lib/types";

/** Same projection as components/track-preview.tsx, with a CSS view-timeline draw effect and no client hydration. */
export function AnimatedTrack({
  track,
  cover = false,
  className,
}: {
  track: TrackPosition[];
  /** Fill the container edge-to-edge (crops overflow) instead of letterboxing -- for full-bleed decorative use. */
  cover?: boolean;
  className?: string;
}) {
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
    const y = height - (((p.lat - minLat) / latRange) * height * (1 - padding * 2) + height * padding);
    return [x, y] as const;
  };

  const points = track.map(project);
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [startX, startY] = points[0];
  const [endX, endY] = points[points.length - 1];

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio={cover ? "xMidYMid slice" : "xMidYMid meet"}
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="mkTrackFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-light)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-brand-light)" stopOpacity="0" />
          </linearGradient>
          <pattern id="mkGrid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" stroke="currentColor" strokeOpacity="0.08" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#mkGrid)" />
        <path
          d={`${path} L${endX},${height} L${startX},${height} Z`}
          fill="url(#mkTrackFade)"
          className="marketing-track-fill"
        />
        <path
          d={path}
          pathLength={1}
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="marketing-track-path"
        />
        <circle cx={startX} cy={startY} r={6} fill="var(--color-brand)" stroke="white" strokeWidth={2} />
        <circle
          cx={endX}
          cy={endY}
          r={6}
          fill="#101727"
          stroke="white"
          strokeWidth={2}
          className="marketing-track-fill"
        />
      </svg>
    </div>
  );
}
