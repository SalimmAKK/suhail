"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ALULA, type Site } from "@/data/sites";

/* CLAUDE.md section 8.3, the site map.

   Four dark-sky sites on a stylised map of the AlUla region. Information, not
   a toy: one gentle fly-in on load and then the camera stays where the
   traveller puts it. No cluster animations, no fly-to on every click.

   Section 9 governs which pins appear at all. A coordinate this project could
   not source is not rounded off and drawn anyway:

     sourced      plain gold pin
     approximate  dashed ring, and it says "approximate location"
     unsourced    no pin. Wadi Nakhlah is listed and linked, never plotted.

   The style is light-v11 retuned layer by layer after load rather than a
   hand-authored style JSON. Same outcome, and it survives Mapbox updating the
   base style. Every default blue is repainted. */

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/* the region the four sites sit in, with room around them */
const FRAME: [[number, number], [number, number]] = [
  [37.55, 26.45],
  [38.25, 27.4],
];

type MapState =
  | "loading"
  | "ready"
  | "unsupported"
  | "no-token"
  /** the token loads the style but is refused the tile data */
  | "unauthorized"
  | "failed";

export function SiteMap({ sites, className }: { sites: Site[]; className?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [state, setState] = useState<MapState>(TOKEN ? "loading" : "no-token");

  const plotted = sites.filter((s) => s.coordinatePrecision !== "unsourced");

  /* Giving up on the map means letting go of it: the GL context and its
     event listeners outlive the element otherwise. */
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
        fitBoundsOptions: { padding: 80 },
        /* section 8.3: information, not a game */
        pitch: 0,
        attributionControl: true,
        cooperativeGestures: true,
      });
    } catch {
      /* Almost always WebGL being unavailable rather than a bad token. The
         constructor throws synchronously, so the state change is deferred out
         of the effect body rather than cascading a render inside it. */
      queueMicrotask(() => setState("unsupported"));
      return;
    }

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    /* A tile that 404s is not a broken map, and treating every error event as
       fatal made the map fail intermittently on a single slow tile. What
       actually counts as failure is the style never arriving at all, so that
       is what is timed. */
    const giveUp = setTimeout(() => setState((s) => (s === "loading" ? "failed" : s)), 12_000);

    /* A token can be valid enough to fetch the style and still be refused the
       tile data behind it. That renders as an empty cream rectangle with the
       markers floating on nothing, which reads as a deliberately minimal map
       rather than a broken one. It has to be caught and said out loud.

       Mapbox's error events carry an empty message and no status for this
       case, so the detection counts them instead. A healthy map raises none
       at all, and areTilesLoaded() is no help: it reports true once the
       requests finish, whether they succeeded or were refused. A handful of
       errors rather than one, so a single flaky tile is not called an
       outage. */
    let tileErrors = 0;
    map.on("error", (e) => {
      tileErrors++;
      console.error("Mapbox:", e.error?.message || "tile or source request failed");
    });

    map.on("style.load", () => {
      clearTimeout(giveUp);
      retune(map);
      setState("ready");

      /* One gentle fly-in from a wider view, and only ever this one. */
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced) {
        map.fitBounds(FRAME, { padding: 80, duration: 1200, essential: false });
      }

      for (const site of plotted) {
        new mapboxgl.Marker({ element: markerElement(site), anchor: "bottom" })
          .setLngLat([site.lng, site.lat])
          .setPopup(
            new mapboxgl.Popup({
              offset: 18,
              closeButton: false,
              className: "suhail-popup",
            }).setHTML(popupHTML(site)),
          )
          .addTo(map);
      }

      /* AlUla itself, so the sites have somewhere to be north of */
      new mapboxgl.Marker({ element: townElement(), anchor: "center" })
        .setLngLat([ALULA.lng, ALULA.lat])
        .addTo(map);

      window.setTimeout(() => {
        if (tileErrors >= 3) setState("unauthorized");
      }, 6000);

      /* Section 8.3: one fly-in on load, and the camera then stays where the
         visitor puts it. Counting moves after the initial settle makes that
         rule checkable from outside rather than a claim in a comment. */
      map.once("idle", () => {
        const el = container.current;
        if (!el) return;
        el.dataset.cameraMoves = "0";
        map.on("movestart", () => {
          el.dataset.cameraMoves = String(Number(el.dataset.cameraMoves ?? 0) + 1);
        });
      });
    });

    return () => {
      clearTimeout(giveUp);
      map.remove();
      mapRef.current = null;
    };
    /* built once: re-running would tear down the camera the visitor set */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state !== "loading" && state !== "ready") {
    return (
      /* keyed apart from the map branch: without it React reuses the same
         element and Mapbox's own DOM, which it does not know about, survives
         inside the fallback */
      <div key="fallback" className={className} data-map-state={state}>
        <div className="flex h-full min-h-[320px] items-center justify-center rounded-lg border border-line bg-sand/40 p-8">
          <p className="max-w-[46ch] text-center text-muted">
            {state === "no-token"
              ? "The map is not configured on this deployment, so it is not being shown. The four sites and their coordinates are listed below."
              : state === "unsupported"
                ? "This browser cannot render the map, which needs WebGL. The four sites and their coordinates are listed below."
                : state === "unauthorized"
                  ? "The map data could not be loaded: Mapbox served the style but refused the tiles behind it. Rather than show an empty map, the four sites and their coordinates are listed below."
                  : "The map failed to load. The four sites and their coordinates are listed below."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div key="map" className={className} data-map-state={state}>
      <div
        ref={container}
        role="application"
        aria-label="Map of the dark-sky sites around AlUla"
        className="h-full min-h-[320px] w-full overflow-hidden rounded-lg border border-line bg-sand/40"
      />
    </div>
  );
}

/* ---------------------------------------------------------------- markers */

function markerElement(site: Site): HTMLElement {
  const approximate = site.coordinatePrecision === "approximate";
  const el = document.createElement("button");
  el.type = "button";
  el.className = "suhail-marker";
  el.setAttribute(
    "aria-label",
    `${site.name}${approximate ? ", approximate location" : ""}`,
  );
  el.dataset.precision = site.coordinatePrecision;
  el.innerHTML = `
    <span class="suhail-marker-pin${approximate ? " is-approximate" : ""}"></span>
    <span class="suhail-marker-label">${escapeHtml(site.name)}</span>
    ${approximate ? '<span class="suhail-marker-note">approximate location</span>' : ""}
  `;
  return el;
}

function townElement(): HTMLElement {
  const el = document.createElement("div");
  el.className = "suhail-town";
  el.innerHTML = `<span class="suhail-town-dot"></span><span class="suhail-town-label">AlUla</span>`;
  return el;
}

function popupHTML(site: Site): string {
  const approximate = site.coordinatePrecision === "approximate";
  return `
    <p class="suhail-popup-name">${escapeHtml(site.name)}</p>
    <p class="suhail-popup-coords">${site.lat.toFixed(3)}&deg;N &middot; ${site.lng.toFixed(3)}&deg;E</p>
    ${approximate ? '<p class="suhail-popup-note">Approximate location, not yet sourced</p>' : ""}
    <a class="suhail-popup-link" href="/sites/${site.slug}">View site</a>
  `;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

/* ------------------------------------------------------------------ style

   light-v11 is grey-blue out of the box. This walks its layers and repaints
   them into the palette: cream ground, sand relief, ink water, hairline
   roads. Section 8.3 also asks for no roads or labels beyond the essentials,
   so minor roads and every POI label are removed rather than restyled. */

const TOKENS = {
  cream: "#FAF8F3",
  sand: "#E8DFC9",
  ink: "#1A1D2E",
  line: "#E4DFD4",
  muted: "#6B6B6B",
};

function retune(map: mapboxgl.Map) {
  const style = map.getStyle();
  if (!style?.layers) return;

  for (const layer of style.layers) {
    const id = layer.id;

    /* strip the clutter: minor roads, transit, and every point of interest */
    if (
      /poi|transit|ferry|aeroway|bridge-|tunnel-|golf|pitch/.test(id) ||
      /road-(minor|street|path|track|service)/.test(id)
    ) {
      if (map.getLayer(id)) map.removeLayer(id);
      continue;
    }

    try {
      if (layer.type === "background") {
        map.setPaintProperty(id, "background-color", TOKENS.cream);
      } else if (layer.type === "fill") {
        if (/water/.test(id)) {
          map.setPaintProperty(id, "fill-color", TOKENS.ink);
          map.setPaintProperty(id, "fill-opacity", 0.85);
        } else if (/land|landuse|national-park|park/.test(id)) {
          map.setPaintProperty(id, "fill-color", TOKENS.sand);
          map.setPaintProperty(id, "fill-opacity", 0.45);
        } else {
          map.setPaintProperty(id, "fill-color", TOKENS.sand);
          map.setPaintProperty(id, "fill-opacity", 0.3);
        }
      } else if (layer.type === "line") {
        map.setPaintProperty(id, "line-color", /water/.test(id) ? TOKENS.ink : TOKENS.line);
      } else if (layer.type === "hillshade") {
        map.setPaintProperty(id, "hillshade-shadow-color", TOKENS.ink);
        map.setPaintProperty(id, "hillshade-highlight-color", TOKENS.cream);
        map.setPaintProperty(id, "hillshade-exaggeration", 0.35);
      } else if (layer.type === "symbol") {
        map.setPaintProperty(id, "text-color", TOKENS.muted);
        map.setPaintProperty(id, "text-halo-color", TOKENS.cream);
        map.setPaintProperty(id, "text-halo-width", 1.4);
      }
    } catch {
      /* a layer that does not take the property it was offered is not worth
         failing the whole map over */
    }
  }
}
