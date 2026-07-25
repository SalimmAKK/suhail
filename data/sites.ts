/* The four AlUla dark-sky sites.

   All four are real DarkSky International certified Dark Sky Parks. AlUla
   Manara and AlGharameel were certified in 2024, the first in Saudi Arabia
   and the Gulf. Sharaan National Park and Wadi Nakhlah followed, and the
   four together form one of the largest connected Dark Sky Parks in the
   world, ranking third globally by area.

   CLAUDE.md rule 12 applies hard here. Only AlUla Manara has a precise
   published coordinate: an ERA5 site-assessment paper puts the observatory
   at 27 deg 11' 32.4" N, 37 deg 48' 40.1" E at 1209 m. The other three are
   positioned from published descriptions of where they are, and say so in
   `verify`. Those notes are rendered on the site pages, not swallowed.

   Sources:
   - darksky.org/places/alula-manara-and-algharameel-nature-reserves/
   - darksky.org/news/alula-expands-dark-sky-certification/
   - saudipedia.com/en/where-is-gharameel-nature-reserve-located
   - experiencealula.com/en/places-to-go/sharaan-nature-reserve
   - rcu.gov.sa/en/strategic-initiatives/sharaan-nature-reserve */

/** What a site's terrain and horizon suit it for. Drives the night picker. */
export type SkyTarget =
  | "southern-sky"
  | "milky-way-core"
  | "wide-horizon"
  | "deep-sky"
  | "naked-eye"
  | "telescope";

/* How much the coordinate can be trusted. CLAUDE.md section 9 turns this
   into map behaviour: sourced pins are drawn plainly, approximate pins get a
   dashed ring and say so, and unsourced sites stay off the map entirely
   rather than inventing a position a traveller might drive to. */
export type CoordinatePrecision = "sourced" | "approximate" | "unsourced";

export type Site = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  elevationM: number | null;
  bortleClass: number | null;
  coordinatePrecision: CoordinatePrecision;
  /** One or two sentences. Place-specific, no brochure language. */
  description: string;
  bestFor: SkyTarget[];
  /** Anything on this record that is not sourced. Rendered, never hidden. */
  verify: string[];
};

/** AlUla town, the reference point every distance is measured from. */
export const ALULA = { lat: 26.60662, lng: 37.92465 } as const;

export const SITES: Site[] = [
  {
    slug: "manara",
    name: "AlUla Manara",
    lat: 27.19233,
    lng: 37.81114,
    elevationM: 1209,
    bortleClass: 2,
    coordinatePrecision: "sourced",
    description:
      "The highest and driest of the four, on the plateau between Gharameel and Harrat Uwayrid. A four-metre telescope and two two-metre telescopes are being built here, alongside a planetarium and a visitor centre. The observatory is not open yet, so nothing is bookable at Manara.",
    bestFor: ["telescope", "deep-sky", "wide-horizon"],
    verify: [
      "Bortle 2 is inferred from Dark Sky Park certification and AlUla's top-5-percent darkness ranking. No per-site SQM reading is published.",
    ],
  },
  {
    slug: "algharameel",
    name: "AlGharameel Nature Reserve",
    lat: 27.05,
    lng: 37.85,
    elevationM: null,
    bortleClass: 2,
    coordinatePrecision: "approximate",
    description:
      "Sixty kilometres north of AlUla, a field of eroded sandstone fins standing out of open sand. The rock formations give the sky a foreground, which is why almost every photograph of AlUla's night sky was taken here.",
    bestFor: ["milky-way-core", "naked-eye", "wide-horizon"],
    verify: [
      "Coordinates are approximate, placed from the published description of the reserve as roughly 60 km north of AlUla. Confirm against RCU mapping before the demo.",
      "Elevation not published.",
      "Bortle 2 inferred from Dark Sky Park certification, not a per-site measurement.",
    ],
  },
  {
    slug: "sharaan",
    name: "Sharaan National Park",
    lat: 26.85,
    lng: 37.98,
    elevationM: null,
    bortleClass: 2,
    coordinatePrecision: "approximate",
    description:
      "Fifteen hundred square kilometres of canyon and sandstone north-east of Hegra, about forty-five minutes from AlUla's old town. The canyon walls cut the northern horizon, which makes it the better site when the target is low in the south.",
    bestFor: ["southern-sky", "deep-sky", "naked-eye"],
    verify: [
      "Coordinates are approximate, placed from published descriptions of the reserve north-east of Hegra. Confirm against RCU mapping before the demo.",
      "Elevation not published.",
      "Bortle 2 inferred from Dark Sky Park certification, not a per-site measurement.",
    ],
  },
  {
    slug: "wadi-nakhlah",
    name: "Wadi Nakhlah Nature Reserve",
    lat: 26.72,
    lng: 37.7,
    elevationM: null,
    bortleClass: 2,
    coordinatePrecision: "unsourced",
    description:
      "Certified alongside Sharaan, with which it shares just over six thousand square kilometres of protected sky. The newest of the four to open to visitors, and the least built on.",
    bestFor: ["wide-horizon", "naked-eye"],
    verify: [
      "Coordinates are a placeholder. No public coordinate or boundary for Wadi Nakhlah was found. Do not publish the map marker until this is sourced.",
      "Elevation not published.",
      "Bortle 2 inferred from Dark Sky Park certification, not a per-site measurement.",
    ],
  },
];

export const siteBySlug = (slug: string): Site | undefined =>
  SITES.find((s) => s.slug === slug);
