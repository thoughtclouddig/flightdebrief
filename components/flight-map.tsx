"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Map } from "lucide-react";
import { TrackPreview } from "@/components/track-preview";
import { simplifyTrackForDisplay } from "@/lib/flight-track";
import type { TrackPosition } from "@/lib/types";

/**
 * Free, keyless vector basemap (CARTO Positron via MapLibre) -- no Mapbox
 * token required. This is what makes the track read as a real flight over
 * real streets/terrain instead of an abstract line on a grid.
 */
const BASEMAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export function FlightMap({ track }: { track: TrackPosition[] | null }) {
  const displayTrack = simplifyTrackForDisplay(track);

  if (!displayTrack || displayTrack.length < 2) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-6 text-center dark:border-white/15">
        <p className="text-sm text-slate-400">No track data available for this flight.</p>
        <p className="text-xs text-slate-400">
          Some aircraft have sparse or no public ADS-B position history even when the flight itself was found --
          this doesn&rsquo;t affect the rest of the debrief.
        </p>
      </div>
    );
  }

  return <DeferredMap track={displayTrack} />;
}

function DeferredMap({ track }: { track: TrackPosition[] }) {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const [mapLoadFailed, setMapLoadFailed] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapAttempt, setMapAttempt] = useState(0);
  const loadMap = useCallback(() => {
    setMapLoadFailed(false);
    setMapLoaded(false);
    setMapAttempt((attempt) => attempt + 1);
    setShouldLoadMap(true);
  }, []);
  const handleMapLoadError = useCallback(() => setMapLoadFailed(true), []);
  const handleMapLoad = useCallback(() => setMapLoaded(true), []);

  useEffect(() => {
    const placeholder = placeholderRef.current;
    if (!placeholder || shouldLoadMap || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMap();
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(placeholder);

    return () => observer.disconnect();
  }, [loadMap, shouldLoadMap]);

  return (
    <div
      ref={placeholderRef}
      data-testid="flight-map"
      aria-busy={shouldLoadMap && !mapLoaded && !mapLoadFailed}
      className="relative h-64 overflow-hidden rounded-xl border border-hairline bg-slate-50 dark:bg-slate-900/40 sm:h-80"
    >
      {!mapLoaded ? (
        <TrackMapPlaceholder
          track={track}
          onLoadMap={loadMap}
          failed={mapLoadFailed}
          loading={shouldLoadMap && !mapLoadFailed}
        />
      ) : null}
      {shouldLoadMap && !mapLoadFailed ? (
        <MapLibreTrack
          key={mapAttempt}
          track={track}
          onLoad={handleMapLoad}
          onLoadError={handleMapLoadError}
        />
      ) : null}
    </div>
  );
}

function TrackMapPlaceholder({
  track,
  onLoadMap,
  failed = false,
  loading = false,
}: {
  track: TrackPosition[];
  onLoadMap: () => void;
  failed?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="absolute inset-0 h-full w-full">
      <TrackPreview track={track} />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-white via-white/90 to-transparent px-4 pb-4 pt-12 dark:from-slate-950 dark:via-slate-950/90">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {failed ? "The interactive map could not load." : loading ? "Loading interactive map…" : "Route preview"}
        </p>
        {!loading ? (
          <button
            type="button"
            onClick={onLoadMap}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:bg-slate-800 dark:text-slate-100 dark:ring-white/15 dark:hover:bg-slate-700"
          >
            <Map className="size-3.5" />
            {failed ? "Try interactive map again" : "Load interactive map"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MapLibreTrack({
  track,
  onLoad,
  onLoadError,
}: {
  track: TrackPosition[];
  onLoad: () => void;
  onLoadError: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("maplibre-gl").Map | undefined;
    let cancelled = false;

    (async () => {
      try {
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
          paint: { "line-color": "#f07621", "line-width": 8, "line-opacity": 0.25, "line-blur": 2 },
        });
        localMap.addLayer({
          id: "track-line",
          type: "line",
          source: "track",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#f07621", "line-width": 3 },
        });

        const startEl = document.createElement("div");
        startEl.style.cssText =
          "width:14px;height:14px;border-radius:50%;background:#f07621;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)";
        new maplibregl.Marker({ element: startEl }).setLngLat(coords[0]).addTo(localMap);

        const endEl = document.createElement("div");
        endEl.style.cssText =
          "width:14px;height:14px;border-radius:50%;background:#101727;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)";
        new maplibregl.Marker({ element: endEl }).setLngLat(coords[coords.length - 1]).addTo(localMap);

        // Invisible, wide-hit-area points (one per track sample) so hovering the
        // line anywhere near a sample surfaces that sample's altitude/speed/time.
        localMap.addSource("track-points", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: track.map((p, i) => ({
              type: "Feature" as const,
              properties: { altitudeFt: p.altitudeFt ?? null, groundSpeedKt: p.groundSpeedKt ?? null, timestamp: p.timestamp, index: i },
              geometry: { type: "Point" as const, coordinates: [p.lon, p.lat] },
            })),
          },
        });
        localMap.addLayer({
          id: "track-points-hit",
          type: "circle",
          source: "track-points",
          paint: { "circle-radius": 10, "circle-opacity": 0, "circle-stroke-opacity": 0 },
        });
        localMap.addSource("track-hover", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        localMap.addLayer({
          id: "track-hover-point",
          type: "circle",
          source: "track-hover",
          paint: {
            "circle-radius": 5,
            "circle-color": "#101727",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });

        localMap.on("mousemove", "track-points-hit", (e) => {
          const feature = e.features?.[0];
          if (!feature || feature.geometry.type !== "Point") return;
          localMap.getCanvas().style.cursor = "pointer";

          const coordinates = feature.geometry.coordinates.slice() as [number, number];
          const { altitudeFt, groundSpeedKt, timestamp } = feature.properties as {
            altitudeFt: number | null;
            groundSpeedKt: number | null;
            timestamp: string;
          };

          const time = new Date(timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC",
          });
          const altText = altitudeFt != null ? `${altitudeFt.toLocaleString()} ft` : "Altitude unavailable";
          const speedText = groundSpeedKt != null ? `${Math.round(groundSpeedKt)} kt` : "Speed unavailable";

          (localMap.getSource("track-hover") as import("maplibre-gl").GeoJSONSource)?.setData({
            type: "FeatureCollection",
            features: [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates } }],
          });

          popup
            .setLngLat(coordinates)
            .setHTML(
              `<div style="font:600 12px system-ui;color:#101727;line-height:1.5">${time} UTC<br/>${altText} &middot; ${speedText}</div>`,
            )
            .addTo(localMap);
        });

        localMap.on("mouseleave", "track-points-hit", () => {
          localMap.getCanvas().style.cursor = "";
          popup.remove();
          (localMap.getSource("track-hover") as import("maplibre-gl").GeoJSONSource)?.setData({
            type: "FeatureCollection",
            features: [],
          });
        });
          onLoad();
        });
      } catch {
        if (!cancelled) onLoadError();
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [onLoad, onLoadError, track]);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
}
