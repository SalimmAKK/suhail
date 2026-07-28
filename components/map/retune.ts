import type mapboxgl from "mapbox-gl";

/* light-v11 is grey-blue out of the box. This walks its layers and repaints
   them into the palette: cream ground, sand relief, ink water, hairline roads.
   CLAUDE.md section 8.3 also asks for no roads or labels beyond the
   essentials, so minor roads and every point of interest are removed rather
   than restyled.

   Retuning the stock style after load rather than hand-authoring a style JSON
   is deliberate: same outcome, and it survives Mapbox updating the base style.

   Extracted from SiteMap so the /sites map and the split views' MapPanel
   cannot drift into two different-looking maps of the same region. */

const TOKENS = {
  cream: "#FAF8F3",
  sand: "#E8DFC9",
  ink: "#1A1D2E",
  line: "#E4DFD4",
  muted: "#6B6B6B",
};

export function retuneToPalette(map: mapboxgl.Map) {
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
