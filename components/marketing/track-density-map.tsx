"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hundreds of ground tracks drawn over each other, so density is the message.
 *
 * Deliberately not FlightMap. That component draws one flight faithfully --
 * you are meant to follow the line. Here no individual line means anything;
 * the finding is where they pile up. So every track is drawn thin and nearly
 * transparent, and the practice areas, the departure corridor and the pattern
 * emerge from accumulated opacity rather than from any one path.
 *
 * Rendered on canvas rather than as SVG paths or map layers: 400 tracks at
 * 120 points each is 48,000 points, which is nothing to fill on a canvas and
 * a lot of DOM nodes otherwise.
 */

const BASEMAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export interface DensityTrack {
  points: [number, number][];
}

export function TrackDensityMap({
  tracks,
  center,
  label,
}: {
  tracks: DensityTrack[];
  /** The airport, so the view is framed on the field rather than on the data's bounding box. */
  center: { lat: number; lon: number } | null;
  label: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !center || !tracks.length) return;
    let map: { remove: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const maplibre = await import("maplibre-gl");
        if (cancelled || !containerRef.current) return;

        const instance = new maplibre.Map({
          container: containerRef.current,
          style: BASEMAP_STYLE,
          center: [center.lon, center.lat],
          zoom: 9.4,
          attributionControl: { compact: true },
          // A static figure, not a toy. Panning around a density map invites
          // reading individual lines, which is exactly what it does not mean.
          interactive: false,
        });
        map = instance;

        instance.on("load", () => {
          if (cancelled) return;
          instance.addSource("tracks", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: tracks.map((t) => ({
                type: "Feature" as const,
                properties: {},
                geometry: { type: "LineString" as const, coordinates: t.points },
              })),
            },
          });
          instance.addLayer({
            id: "tracks",
            type: "line",
            source: "tracks",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": "#f07621",
              // Thin and faint on purpose. A single track is almost invisible;
              // fifty overlapping ones are unmistakable. That difference is
              // the entire chart.
              "line-width": 1,
              "line-opacity": 0.13,
            },
          });
        });
      } catch {
        // A missing basemap or a blocked CDN shouldn't take the section with
        // it -- the caption below still says what the figure would have said.
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [tracks, center]);

  if (!tracks.length || !center || failed) return null;

  return (
    <figure className="mt-5">
      <div
        ref={containerRef}
        className="h-[420px] w-full overflow-hidden rounded-xl border border-hairline"
        role="img"
        aria-label={label}
      />
      <figcaption className="mt-3 text-xs leading-relaxed text-[#5b6472]">
        {tracks.length.toLocaleString("en-US")} local flights, drawn over each other. Brighter areas are where
        aircraft from this field spend the most time. Individual flights are not identified.
      </figcaption>
    </figure>
  );
}
