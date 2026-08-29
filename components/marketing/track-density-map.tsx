"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minus, Plus, X } from "lucide-react";

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
  const mapRef = useRef<{ zoomIn: () => void; zoomOut: () => void; resize: () => void } | null>(null);
  const [failed, setFailed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const zoom = useCallback((direction: 1 | -1) => {
    if (direction === 1) mapRef.current?.zoomIn();
    else mapRef.current?.zoomOut();
  }, []);

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
          // Interactive after all. The first version locked the view on the
          // grounds that panning invites reading individual lines -- but at
          // this scale the pattern and the practice areas are different
          // orders of magnitude apart, and without zoom the reader can see
          // neither properly. The summary above the map carries the finding,
          // so exploring underneath it is a bonus rather than a
          // misinterpretation waiting to happen.
          interactive: true,
          dragRotate: false,
          touchPitch: false,
        });
        instance.scrollZoom.disable(); // Page scroll should not become map zoom.
        map = instance;
        mapRef.current = instance as unknown as typeof mapRef.current;

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
              //
              // Both values scale with the sample, because a fixed opacity
              // only works at the density it was tuned for: 0.13 reads well
              // at four hundred tracks and disappears at twenty-five. The
              // inverse-square-root keeps the accumulated brightness in the
              // busy areas roughly constant however many tracks there are.
              "line-width": tracks.length < 120 ? 1.4 : 1,
              "line-opacity": Math.min(0.5, Math.max(0.08, 1.8 / Math.sqrt(tracks.length))),
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

  // The container changes size when it goes full screen, and MapLibre only
  // learns that if it is told. Observed rather than guessed with a timeout:
  // a single delayed resize races the CSS transition and leaves the map
  // measuring a box it no longer occupies.
  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => mapRef.current?.resize());
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Escape is what people press. Without it, full screen is a trap on a page
  // whose own controls have just scrolled out of reach.
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  // Lock the page behind the overlay.
  //
  // Not by pinning the body: `position: fixed` on the body moves the layout
  // origin out from under MapLibre, whose cached container offset then no
  // longer matches reality, and every pointer event resolves to the wrong
  // place -- which showed up as the map creeping upward on its own. Hiding
  // overflow on the root element stops the page scrolling without moving
  // anything, so the map's geometry stays true.
  useEffect(() => {
    if (!fullscreen) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    const previousGutter = root.style.scrollbarGutter;
    root.style.overflow = "hidden";
    // Without this the page jumps sideways by the scrollbar width when it
    // disappears, which reads as the layout twitching every time the map opens.
    root.style.scrollbarGutter = "stable";
    return () => {
      root.style.overflow = previousOverflow;
      root.style.scrollbarGutter = previousGutter;
    };
  }, [fullscreen]);

  if (!tracks.length || !center || failed) return null;

  return (
    <figure
      className={
        fullscreen
          ? "fixed inset-0 z-50 m-0 flex flex-col overscroll-contain bg-white p-4 sm:p-6"
          : "mt-5"
      }
    >
      <div className="relative flex-1">
        <div
          ref={containerRef}
          className={`w-full overflow-hidden rounded-xl border border-hairline ${
            fullscreen ? "h-full" : "h-[420px]"
          }`}
          role="img"
          aria-label={label}
        />
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          <MapButton onClick={() => zoom(1)} label="Zoom in"><Plus size={16} /></MapButton>
          <MapButton onClick={() => zoom(-1)} label="Zoom out"><Minus size={16} /></MapButton>
          <MapButton
            onClick={() => setFullscreen((v) => !v)}
            label={fullscreen ? "Exit full screen" : "View full screen"}
          >
            {fullscreen ? <X size={16} /> : <Maximize2 size={16} />}
          </MapButton>
        </div>
      </div>
      <figcaption className="mt-3 shrink-0 text-xs leading-relaxed text-[#5b6472]">
        {tracks.length.toLocaleString("en-US")} local flights, drawn over each other. Brighter areas are where
        aircraft from this field spend the most time. Drag to pan, and use the controls to zoom. Individual
        flights are not identified.
      </figcaption>
    </figure>
  );
}

function MapButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-white/95 text-[#33383f] shadow-sm transition-colors hover:bg-white hover:text-brand"
    >
      {children}
    </button>
  );
}
