"use client";

import { useEffect, useRef } from "react";
import type { TrackPosition } from "@/lib/types";

/**
 * Free, keyless vector basemap (CARTO Positron via MapLibre) -- no Mapbox
 * token required. This is what makes the track read as a real flight over
 * real streets/terrain instead of an abstract line on a grid.
 */
const BASEMAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export function FlightMap({ track }: { track: TrackPosition[] | null }) {
  if (!track || track.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-400 dark:border-white/15">
        No track data available for this flight.
      </div>
    );
  }

  return (
    <div className="h-64 overflow-hidden rounded-xl border border-hairline sm:h-80">
      <MapLibreTrack track={track} />
    </div>
  );
}

function MapLibreTrack({ track }: { track: TrackPosition[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("maplibre-gl").Map | undefined;
    let cancelled = false;

    (async () => {
      const maplibregl = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");
      if (cancelled || !containerRef.current) return;

      const coords = track.map((p) => [p.lon, p.lat] as [number, number]);
      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new maplibregl.LngLatBounds(coords[0], coords[0]),
      );

      const localMap = new maplibregl.Map({
        container: containerRef.current,
        style: BASEMAP_STYLE,
        bounds,
        fitBoundsOptions: { padding: 36 },
        attributionControl: false,
      });
      map = localMap;

      localMap.addControl(new maplibregl.AttributionControl({ compact: true }));

      localMap.on("load", () => {
        localMap.addSource("track", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } },
        });
        // Soft outer glow, then the crisp track line on top -- reads like a highlighted GPS trace.
        localMap.addLayer({
          id: "track-glow",
          type: "line",
          source: "track",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#1d6fa5", "line-width": 8, "line-opacity": 0.25, "line-blur": 2 },
        });
        localMap.addLayer({
          id: "track-line",
          type: "line",
          source: "track",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#1d6fa5", "line-width": 3 },
        });

        const startEl = document.createElement("div");
        startEl.style.cssText =
          "width:14px;height:14px;border-radius:50%;background:#1d6fa5;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)";
        new maplibregl.Marker({ element: startEl }).setLngLat(coords[0]).addTo(localMap);

        const endEl = document.createElement("div");
        endEl.style.cssText =
          "width:14px;height:14px;border-radius:50%;background:#101826;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)";
        new maplibregl.Marker({ element: endEl }).setLngLat(coords[coords.length - 1]).addTo(localMap);
      });
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [track]);

  return <div ref={containerRef} className="h-full w-full" />;
}
