"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Layers, LocateFixed, Minus, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { cn, focusRing } from "@/lib/cn";
import { retuneToPalette } from "@/components/map/retune";

/* The map column both split views share.
 *
 * The base map is real Mapbox GL, styled to the mock rather than left on
 * Mapbox defaults: light-v11 walked layer by layer into the palette, custom
 * DOM markers for the pins, and every control replaced by a square, bordered
 * one of ours. mapboxgl.NavigationControl is deliberately not added — the
 * zoom stack in the bottom-right is the control, and two sets would be two
 * different visual languages on one surface.
 *
 * The failure handling is carried over from the /sites map, where it was
 * built and verified: a token can load a style and still be refused the tiles
 * behind it, which renders as an empty rectangle with markers floating on
 * nothing. That has to be caught and said out loud rather than shown.
 */

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/* the region the sites sit in, with room around them */
const FRAME: [[number, number], [number, number]] = [
  [37.55, 26.45],
  [38.25, 27.4],
];

export type MapPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** cheapest experience at this site, or null when nothing is running */
  priceSar: number | null;
  approximate: boolean;
};

export type LegendRow = { swatch: string; label: string };

type MapState = "loading" | "ready" | "unsupported" | "no-token" | "unauthorized" | "failed";

export function MapPanel({
  pins,
  legendTitle,
  legendRows,
  searchPlaceholder = "Search sites, operators, dates…",
  searchValue,
  onSearchChange,
  focusedPinId,
  onSelectPin,
  children,
  className,
}: {
  pins: MapPin[];
  legendTitle: string;
  legendRows: LegendRow[];
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** the one pin the list is currently showing, drawn with a pulsing ring */
  focusedPinId?: string | null;
  onSelectPin?: (id: string) => void;
  /** overlays a view adds on top, such as the search view's selected-site card */
  children?: React.ReactNode;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const searchRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<MapState>(TOKEN ? "loading" : "no-token");
  const [terrain, setTerrain] = useState(false);
  const [bookableOnly, setBookableOnly] = useState(false);

  /* Callbacks are read through a ref inside the marker handlers so that the
     map is built exactly once. Rebuilding it would throw away the camera the
     visitor set. Synced in an effect rather than during render: a ref written
     while rendering is not a value React can reason about. */
  const onSelect = useRef(onSelectPin);
  useEffect(() => {
    onSelect.current = onSelectPin;
  }, [onSelectPin]);

  const shown = bookableOnly ? pins.filter((p) => p.priceSar !== null) : pins;

  /* Giving up on the map means letting go of it: the GL context and its event
     listeners outlive the element otherwise. */
  useEffect(() => {
    if (state === "loading" || state === "ready") return;
    mapRef.current?.remove();
    mapRef.current = null;
  }, [state]);

  useEffect(() => {
    if (!TOKEN || !container.current || mapRef.current) return;

    mapboxgl.accessToken = TOKEN;

    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container: container.current,
        style: "mapbox://styles/mapbox/light-v11",
        bounds: FRAME,
        fitBoundsOptions: { padding: 60 },
        pitch: 0,
        attributionControl: true,
        cooperativeGestures: true,
      });
    } catch {
      /* almost always WebGL being unavailable rather than a bad token */
      queueMicrotask(() => setState("unsupported"));
      return;
    }

    mapRef.current = map;

    const giveUp = setTimeout(() => setState((s) => (s === "loading" ? "failed" : s)), 12_000);

    let tileErrors = 0;
    map.on("error", (e) => {
      tileErrors++;
      console.error("Mapbox:", e.error?.message || "tile or source request failed");
    });

    map.on("style.load", () => {
      clearTimeout(giveUp);
      retuneToPalette(map);
      setState("ready");

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced) map.fitBounds(FRAME, { padding: 60, duration: 1200, essential: false });

      window.setTimeout(() => {
        if (tileErrors >= 3) setState("unauthorized");
      }, 6000);
    });

    return () => {
      clearTimeout(giveUp);
      map.remove();
      mapRef.current = null;
    };
    /* built once, on purpose */
  }, []);

  /* Markers are reconciled against the pin list rather than torn down and
     rebuilt, so filtering the list does not make every pin flash. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;

    const wanted = new Set(shown.map((p) => p.id));

    for (const [id, marker] of markers.current) {
      if (!wanted.has(id)) {
        marker.remove();
        markers.current.delete(id);
      }
    }

    for (const pin of shown) {
      const focused = focusedPinId === pin.id;
      const muted = focusedPinId != null && !focused;
      const existing = markers.current.get(pin.id);

      if (existing) {
        const el = existing.getElement();
        el.dataset.focused = String(focused);
        el.dataset.muted = String(muted);
        continue;
      }

      const el = pinElement(pin, focused, muted);
      el.addEventListener("click", () => onSelect.current?.(pin.id));
      markers.current.set(
        pin.id,
        new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([pin.lng, pin.lat])
          .addTo(map),
      );
    }
  }, [shown, focusedPinId, state]);

  /* Layers: the one control that changes what the map is showing rather than
     where it is looking. Terrain relief on, place labels off. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;
    for (const layer of map.getStyle()?.layers ?? []) {
      if (layer.type === "hillshade") {
        try {
          map.setPaintProperty(layer.id, "hillshade-exaggeration", terrain ? 0.8 : 0.35);
        } catch {
          /* a style without hillshade is not an error worth surfacing */
        }
      }
      if (layer.type === "symbol") {
        map.setLayoutProperty(layer.id, "visibility", terrain ? "none" : "visible");
      }
    }
  }, [terrain, state]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const recentre = useCallback(() => {
    mapRef.current?.fitBounds(FRAME, { padding: 60, duration: 700 });
  }, []);

  const broken = state !== "loading" && state !== "ready";

  return (
    <div
      className={cn("relative overflow-hidden bg-neutral-100", className)}
      data-map-state={state}
    >
      {broken ? (
        <div key="fallback" className="flex h-full items-center justify-center p-10">
          <p className="max-w-[46ch] text-center text-[13px] text-neutral-700">
            {state === "no-token"
              ? "The map is not configured on this deployment. Every site is listed beside it, with its coordinates."
              : state === "unsupported"
                ? "This browser cannot render the map, which needs WebGL. Every site is listed beside it, with its coordinates."
                : state === "unauthorized"
                  ? "Mapbox served the style but refused the tiles behind it. Rather than show an empty map, the sites are listed beside it."
                  : "The map failed to load. Every site is listed beside it, with its coordinates."}
          </p>
        </div>
      ) : (
        /* h-full rather than `absolute inset-0`: Mapbox's own stylesheet sets
           `.mapboxgl-map { position: relative }`, which ties with Tailwind's
           `.absolute` on specificity and wins on source order. The container
           then ignored inset-0, sized itself to its absolutely-positioned
           children, and collapsed to zero height with the canvas drawing into
           nothing. */
        <div
          key="map"
          ref={container}
          role="application"
          aria-label="Map of the dark-sky sites around AlUla"
          className="h-full w-full"
        />
      )}

      {/* Top row: docked search and the two square controls. */}
      <div className="absolute inset-x-4 top-4 z-[3] flex gap-2">
        {/* Ink fill rather than the mock's cream. Over a pale Mapbox base the
            cream box dissolved into the map; ink reads immediately as the
            product's own layer sitting on top of someone else's tiles, and
            gives the palette somewhere to be on this half of the screen. */}
        <label
          className={cn(
            "flex flex-1 items-center gap-2.5 border-2 bg-text px-3.5 py-2.5",
            searchValue ? "border-accent" : "border-text",
          )}
        >
          <Search aria-hidden size={16} strokeWidth={2} className="shrink-0 text-accent" />
          <span className="sr-only">Search sites, operators and dates</span>
          <input
            ref={searchRef}
            type="text"
            value={searchValue ?? ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-bg outline-none placeholder:text-bg/45"
          />
          {searchValue ? (
            <button
              type="button"
              onClick={() => onSearchChange?.("")}
              aria-label="Clear search"
              className={cn("shrink-0 text-accent", focusRing)}
            >
              <X aria-hidden size={14} strokeWidth={2.5} />
            </button>
          ) : (
            <span aria-hidden className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-bg/50">
              &#8984;K
            </span>
          )}
        </label>

        <MapSquare
          label={terrain ? "Show place labels" : "Show terrain relief"}
          pressed={terrain}
          onClick={() => setTerrain((t) => !t)}
        >
          <Layers aria-hidden size={17} strokeWidth={2} />
        </MapSquare>
        <MapSquare
          label="Show only sites with something running"
          pressed={bookableOnly}
          onClick={() => setBookableOnly((b) => !b)}
        >
          <SlidersHorizontal aria-hidden size={17} strokeWidth={2} />
        </MapSquare>
      </div>

      {children}

      <div className="absolute bottom-4 left-4 z-[3] flex min-w-[200px] flex-col gap-1.5 border-2 border-text bg-text px-3 py-2.5">
        <p className="border-b border-bg/20 pb-1 font-display text-[11px] font-extrabold uppercase tracking-[0.1em] text-accent">
          {legendTitle}
        </p>
        {legendRows.map((row) => (
          <p
            key={row.label}
            className="flex items-center gap-2 text-[11px] uppercase tracking-[0.06em] text-bg/80"
          >
            <span aria-hidden className="h-2.5 w-2.5 shrink-0" style={{ background: row.swatch }} />
            {row.label}
          </p>
        ))}
      </div>

      <div className="absolute bottom-4 right-4 z-[3] flex flex-col border-2 border-text bg-text">
        <MapZoomButton label="Zoom in" onClick={() => mapRef.current?.zoomIn()}>
          <Plus aria-hidden size={16} strokeWidth={2.5} />
        </MapZoomButton>
        <MapZoomButton label="Zoom out" onClick={() => mapRef.current?.zoomOut()}>
          <Minus aria-hidden size={16} strokeWidth={2.5} />
        </MapZoomButton>
        <MapZoomButton label="Recentre on AlUla" onClick={recentre} last>
          <LocateFixed aria-hidden size={16} strokeWidth={2} />
        </MapZoomButton>
      </div>
    </div>
  );
}

function MapSquare({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        "inline-flex w-[42px] shrink-0 items-center justify-center border-2 border-text",
        "transition-colors duration-150 ease-move",
        focusRing,
        pressed ? "bg-accent text-text" : "bg-text text-bg hover:bg-neutral-800",
      )}
    >
      {children}
    </button>
  );
}

function MapZoomButton({
  label,
  onClick,
  last = false,
  children,
}: {
  label: string;
  onClick: () => void;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-[42px] w-[42px] items-center justify-center text-bg",
        "transition-colors duration-150 ease-move hover:bg-accent hover:text-text",
        focusRing,
        last ? "" : "border-b border-bg/20",
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ markers */

function pinElement(pin: MapPin, focused: boolean, muted: boolean): HTMLElement {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "suhail-pin";
  el.dataset.focused = String(focused);
  el.dataset.muted = String(muted);
  el.setAttribute(
    "aria-label",
    `${pin.name}${pin.approximate ? ", approximate location" : ""}${
      pin.priceSar !== null ? `, from SAR ${pin.priceSar}` : ""
    }`,
  );

  const price =
    pin.priceSar !== null
      ? `<span class="suhail-pin-price">SAR ${pin.priceSar}</span>`
      : "";

  el.innerHTML = `
    <span class="suhail-pin-label">
      <span class="suhail-pin-mark"></span>${escapeHtml(pin.name)}${price}
    </span>
    <span class="suhail-pin-ring"></span>
    <span class="suhail-pin-dot${pin.approximate ? " is-approximate" : ""}"></span>
  `;
  return el;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}
