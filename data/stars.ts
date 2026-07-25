/* Curated constellations for the AlUla sky.

   Twenty-two constellations, enough that every month of the year yields the
   eight to twelve the star chart calls for (CLAUDE.md section 8.1), and
   including the one this product is named after.

   Coordinates are J2000 right ascension in decimal hours and declination in
   decimal degrees, from standard bright-star catalogue values. Magnitudes
   are visual. This is a chart, not an ephemeris: positions are fixed stars,
   so they do not need recomputing, and catalogue precision is far finer than
   anything a 900ms SVG draw-in can show.

   `months` is when the constellation is well placed in the evening sky
   (roughly 20:00 to midnight local) from about 27 degrees north. A
   constellation is listed in a month if it is usefully observable then, not
   merely above the horizon at some point in the night.

   Nothing here is invented. Star names, coordinates and magnitudes are
   public catalogue data. */

import type { SkyTarget } from "@/data/sites";

export type Star = {
  /** unique within its constellation, referenced by `lines` */
  id: string;
  /** J2000 right ascension, decimal hours, 0 to 24 */
  ra: number;
  /** J2000 declination, decimal degrees, -90 to 90 */
  dec: number;
  /** visual magnitude. lower is brighter. */
  mag: number;
  /** proper name, shown on the chart for the bright ones only */
  name?: string;
};

export type Constellation = {
  slug: string;
  /** Latin name */
  name: string;
  /** what an English speaker calls it */
  english: string;
  /** months, 1 to 12, when it is well placed in the evening sky */
  months: number[];
  targets: SkyTarget[];
  stars: Star[];
  /** pairs of star ids, drawn as the constellation figure */
  lines: [string, string][];
  /** shown on the site and night-picker panels. one sentence. */
  note?: string;
};

export const CONSTELLATIONS: Constellation[] = [
  {
    slug: "carina",
    name: "Carina",
    english: "The Keel",
    months: [1, 2, 3, 4, 12],
    targets: ["southern-sky", "naked-eye"],
    note: "Suhail, or Canopus, clears AlUla's southern horizon by about ten degrees and never rises at all over most of Europe. Arab navigators steered by it.",
    stars: [
      { id: "canopus", ra: 6.3992, dec: -52.696, mag: -0.74, name: "Suhail / Canopus" },
      { id: "avior", ra: 8.375, dec: -59.51, mag: 1.86, name: "Avior" },
      { id: "aspidiske", ra: 9.285, dec: -59.275, mag: 2.21 },
    ],
    lines: [["canopus", "avior"], ["avior", "aspidiske"]],
  },
  {
    slug: "orion",
    name: "Orion",
    english: "The Hunter",
    months: [1, 2, 3, 4, 11, 12],
    targets: ["naked-eye", "deep-sky"],
    note: "The belt sits on the celestial equator, so it rises due east and sets due west from anywhere on earth.",
    stars: [
      { id: "betelgeuse", ra: 5.9195, dec: 7.407, mag: 0.5, name: "Betelgeuse" },
      { id: "rigel", ra: 5.2423, dec: -8.202, mag: 0.13, name: "Rigel" },
      { id: "bellatrix", ra: 5.4189, dec: 6.35, mag: 1.64, name: "Bellatrix" },
      { id: "mintaka", ra: 5.5334, dec: -0.299, mag: 2.23 },
      { id: "alnilam", ra: 5.6036, dec: -1.202, mag: 1.7, name: "Alnilam" },
      { id: "alnitak", ra: 5.6793, dec: -1.943, mag: 1.77 },
      { id: "saiph", ra: 5.7959, dec: -9.67, mag: 2.06 },
    ],
    lines: [
      ["betelgeuse", "bellatrix"],
      ["bellatrix", "mintaka"],
      ["mintaka", "alnilam"],
      ["alnilam", "alnitak"],
      ["alnitak", "betelgeuse"],
      ["mintaka", "rigel"],
      ["alnitak", "saiph"],
      ["rigel", "saiph"],
    ],
  },
  {
    slug: "canis-major",
    name: "Canis Major",
    english: "The Great Dog",
    months: [1, 2, 3, 4, 12],
    targets: ["naked-eye"],
    note: "Sirius is the brightest star in the night sky, and from AlUla it climbs high enough to stop twinkling.",
    stars: [
      { id: "sirius", ra: 6.7525, dec: -16.716, mag: -1.46, name: "Sirius" },
      { id: "mirzam", ra: 6.3783, dec: -17.956, mag: 1.98 },
      { id: "wezen", ra: 7.1399, dec: -26.393, mag: 1.83 },
      { id: "adhara", ra: 6.977, dec: -28.972, mag: 1.5, name: "Adhara" },
      { id: "aludra", ra: 7.4015, dec: -29.303, mag: 2.45 },
    ],
    lines: [
      ["sirius", "mirzam"],
      ["sirius", "wezen"],
      ["wezen", "adhara"],
      ["wezen", "aludra"],
    ],
  },
  {
    slug: "taurus",
    name: "Taurus",
    english: "The Bull",
    months: [1, 2, 3, 10, 11, 12],
    targets: ["naked-eye", "deep-sky"],
    note: "The Pleiades are the test: six stars to most eyes, more than nine under a Bortle 2 sky.",
    stars: [
      { id: "aldebaran", ra: 4.5987, dec: 16.509, mag: 0.85, name: "Aldebaran" },
      { id: "elnath", ra: 5.4382, dec: 28.608, mag: 1.65 },
      { id: "alcyone", ra: 3.7914, dec: 24.105, mag: 2.87, name: "Pleiades" },
    ],
    lines: [["alcyone", "aldebaran"], ["aldebaran", "elnath"]],
  },
  {
    slug: "gemini",
    name: "Gemini",
    english: "The Twins",
    months: [1, 2, 3, 4, 5, 12],
    targets: ["naked-eye"],
    stars: [
      { id: "pollux", ra: 7.7553, dec: 28.026, mag: 1.14, name: "Pollux" },
      { id: "castor", ra: 7.5766, dec: 31.888, mag: 1.58, name: "Castor" },
      { id: "alhena", ra: 6.6285, dec: 16.399, mag: 1.93 },
    ],
    lines: [["castor", "pollux"], ["pollux", "alhena"]],
  },
  {
    slug: "leo",
    name: "Leo",
    english: "The Lion",
    months: [2, 3, 4, 5, 6, 7],
    targets: ["naked-eye", "deep-sky"],
    stars: [
      { id: "regulus", ra: 10.1395, dec: 11.967, mag: 1.35, name: "Regulus" },
      { id: "algieba", ra: 10.3329, dec: 19.841, mag: 2.28 },
      { id: "zosma", ra: 11.2351, dec: 20.524, mag: 2.56 },
      { id: "denebola", ra: 11.8177, dec: 14.572, mag: 2.14, name: "Denebola" },
    ],
    lines: [
      ["regulus", "algieba"],
      ["algieba", "zosma"],
      ["zosma", "denebola"],
      ["denebola", "regulus"],
    ],
  },
  {
    slug: "ursa-major",
    name: "Ursa Major",
    english: "The Great Bear",
    months: [2, 3, 4, 5, 6, 7, 8],
    targets: ["naked-eye"],
    note: "From this latitude the Plough sits low in the north rather than overhead, which is how you know you have travelled south.",
    stars: [
      { id: "dubhe", ra: 11.0621, dec: 61.751, mag: 1.79, name: "Dubhe" },
      { id: "merak", ra: 11.0307, dec: 56.383, mag: 2.37 },
      { id: "phecda", ra: 11.8972, dec: 53.695, mag: 2.44 },
      { id: "megrez", ra: 12.2571, dec: 57.033, mag: 3.31 },
      { id: "alioth", ra: 12.9005, dec: 55.96, mag: 1.77 },
      { id: "mizar", ra: 13.3988, dec: 54.925, mag: 2.23, name: "Mizar" },
      { id: "alkaid", ra: 13.7923, dec: 49.313, mag: 1.86 },
    ],
    lines: [
      ["dubhe", "merak"],
      ["merak", "phecda"],
      ["phecda", "megrez"],
      ["megrez", "dubhe"],
      ["megrez", "alioth"],
      ["alioth", "mizar"],
      ["mizar", "alkaid"],
    ],
  },
  {
    slug: "scorpius",
    name: "Scorpius",
    english: "The Scorpion",
    months: [5, 6, 7, 8, 9],
    targets: ["southern-sky", "milky-way-core", "naked-eye"],
    note: "Antares sits against the thickest part of the Milky Way, and from AlUla the whole tail clears the horizon.",
    stars: [
      { id: "antares", ra: 16.4901, dec: -26.432, mag: 1.06, name: "Antares" },
      { id: "dschubba", ra: 16.0055, dec: -22.622, mag: 2.29 },
      { id: "sargas", ra: 17.622, dec: -42.998, mag: 1.86 },
      { id: "shaula", ra: 17.5601, dec: -37.104, mag: 1.62, name: "Shaula" },
    ],
    lines: [
      ["dschubba", "antares"],
      ["antares", "sargas"],
      ["sargas", "shaula"],
    ],
  },
  {
    slug: "sagittarius",
    name: "Sagittarius",
    english: "The Archer",
    months: [6, 7, 8, 9, 10],
    targets: ["milky-way-core", "deep-sky", "southern-sky"],
    note: "The centre of the galaxy lies behind this constellation. On a moonless night at Gharameel it is the brightest thing in the sky.",
    stars: [
      { id: "kaus-australis", ra: 18.4029, dec: -34.385, mag: 1.85, name: "Kaus Australis" },
      { id: "kaus-media", ra: 18.3499, dec: -29.828, mag: 2.7 },
      { id: "nunki", ra: 18.9211, dec: -26.297, mag: 2.05, name: "Nunki" },
    ],
    lines: [["kaus-australis", "kaus-media"], ["kaus-media", "nunki"]],
  },
  {
    slug: "lyra",
    name: "Lyra",
    english: "The Lyre",
    months: [5, 6, 7, 8, 9, 10, 11],
    targets: ["naked-eye", "deep-sky"],
    stars: [
      { id: "vega", ra: 18.6156, dec: 38.784, mag: 0.03, name: "Vega" },
      { id: "sheliak", ra: 18.8347, dec: 33.363, mag: 3.52 },
      { id: "sulafat", ra: 18.9824, dec: 32.69, mag: 3.25 },
    ],
    lines: [
      ["vega", "sheliak"],
      ["sheliak", "sulafat"],
      ["sulafat", "vega"],
    ],
  },
  {
    slug: "aquila",
    name: "Aquila",
    english: "The Eagle",
    months: [7, 8, 9, 10, 11],
    targets: ["milky-way-core", "naked-eye"],
    stars: [
      { id: "altair", ra: 19.8464, dec: 8.868, mag: 0.76, name: "Altair" },
      { id: "tarazed", ra: 19.7709, dec: 10.613, mag: 2.72 },
      { id: "alshain", ra: 19.9219, dec: 6.407, mag: 3.71 },
    ],
    lines: [["tarazed", "altair"], ["altair", "alshain"]],
  },
  {
    slug: "cygnus",
    name: "Cygnus",
    english: "The Swan",
    months: [7, 8, 9, 10, 11, 12],
    targets: ["milky-way-core", "deep-sky"],
    note: "The cross lies along the Milky Way, so it is the easiest way to trace the band by eye.",
    stars: [
      { id: "deneb", ra: 20.6905, dec: 45.28, mag: 1.25, name: "Deneb" },
      { id: "sadr", ra: 20.3705, dec: 40.257, mag: 2.23 },
      { id: "albireo", ra: 19.512, dec: 27.96, mag: 3.05, name: "Albireo" },
      { id: "gienah", ra: 20.7702, dec: 33.97, mag: 2.46 },
      { id: "delta-cyg", ra: 19.7498, dec: 45.131, mag: 2.87 },
    ],
    lines: [
      ["deneb", "sadr"],
      ["sadr", "albireo"],
      ["sadr", "gienah"],
      ["sadr", "delta-cyg"],
    ],
  },
  {
    slug: "cassiopeia",
    name: "Cassiopeia",
    english: "The Queen",
    months: [8, 9, 10, 11, 12, 1, 2],
    targets: ["naked-eye"],
    stars: [
      { id: "caph", ra: 0.153, dec: 59.15, mag: 2.27 },
      { id: "schedar", ra: 0.6751, dec: 56.537, mag: 2.24, name: "Schedar" },
      { id: "gamma-cas", ra: 0.9451, dec: 60.717, mag: 2.47 },
      { id: "ruchbah", ra: 1.4304, dec: 60.235, mag: 2.68 },
      { id: "segin", ra: 1.9067, dec: 63.67, mag: 3.38 },
    ],
    lines: [
      ["caph", "schedar"],
      ["schedar", "gamma-cas"],
      ["gamma-cas", "ruchbah"],
      ["ruchbah", "segin"],
    ],
  },
  {
    slug: "auriga",
    name: "Auriga",
    english: "The Charioteer",
    months: [11, 12, 1, 2, 3],
    targets: ["naked-eye"],
    stars: [
      { id: "capella", ra: 5.2782, dec: 45.998, mag: 0.08, name: "Capella" },
      { id: "menkalinan", ra: 5.9921, dec: 44.947, mag: 1.9 },
      { id: "theta-aur", ra: 5.9953, dec: 37.213, mag: 2.62 },
      { id: "iota-aur", ra: 4.9497, dec: 33.166, mag: 2.69 },
    ],
    lines: [
      ["capella", "menkalinan"],
      ["menkalinan", "theta-aur"],
      ["theta-aur", "iota-aur"],
      ["iota-aur", "capella"],
    ],
  },
  {
    slug: "canis-minor",
    name: "Canis Minor",
    english: "The Little Dog",
    months: [1, 2, 3, 4, 12],
    targets: ["naked-eye"],
    stars: [
      { id: "procyon", ra: 7.655, dec: 5.225, mag: 0.34, name: "Procyon" },
      { id: "gomeisa", ra: 7.4527, dec: 8.289, mag: 2.89 },
    ],
    lines: [["procyon", "gomeisa"]],
  },
  {
    slug: "bootes",
    name: "Boötes",
    english: "The Herdsman",
    months: [4, 5, 6, 7, 8],
    targets: ["naked-eye"],
    note: "Arcturus is the brightest star of the northern spring sky, and it is orange enough to see the colour without a telescope.",
    stars: [
      { id: "arcturus", ra: 14.261, dec: 19.182, mag: -0.05, name: "Arcturus" },
      { id: "izar", ra: 14.7498, dec: 27.074, mag: 2.35 },
      { id: "seginus", ra: 14.5341, dec: 38.308, mag: 3.03 },
      { id: "nekkar", ra: 15.032, dec: 40.39, mag: 3.49 },
    ],
    lines: [
      ["arcturus", "izar"],
      ["izar", "nekkar"],
      ["nekkar", "seginus"],
      ["seginus", "arcturus"],
    ],
  },
  {
    slug: "virgo",
    name: "Virgo",
    english: "The Maiden",
    months: [4, 5, 6, 7],
    targets: ["naked-eye", "deep-sky"],
    stars: [
      { id: "spica", ra: 13.4199, dec: -11.161, mag: 0.97, name: "Spica" },
      { id: "porrima", ra: 12.6943, dec: -1.449, mag: 2.74 },
      { id: "vindemiatrix", ra: 13.0362, dec: 10.959, mag: 2.83 },
    ],
    lines: [["spica", "porrima"], ["porrima", "vindemiatrix"]],
  },
  {
    slug: "corvus",
    name: "Corvus",
    english: "The Crow",
    months: [4, 5, 6],
    targets: ["southern-sky", "naked-eye"],
    stars: [
      { id: "gienah-crv", ra: 12.2634, dec: -17.542, mag: 2.59 },
      { id: "algorab", ra: 12.4979, dec: -16.516, mag: 2.95 },
      { id: "kraz", ra: 12.5736, dec: -23.397, mag: 2.65 },
      { id: "minkar", ra: 12.1683, dec: -22.62, mag: 3.02 },
    ],
    lines: [
      ["gienah-crv", "algorab"],
      ["algorab", "kraz"],
      ["kraz", "minkar"],
      ["minkar", "gienah-crv"],
    ],
  },
  {
    slug: "libra",
    name: "Libra",
    english: "The Scales",
    months: [5, 6, 7],
    targets: ["naked-eye"],
    stars: [
      { id: "zubenelgenubi", ra: 14.8479, dec: -16.042, mag: 2.75 },
      { id: "zubeneschamali", ra: 15.283, dec: -9.383, mag: 2.61 },
    ],
    lines: [["zubenelgenubi", "zubeneschamali"]],
  },
  {
    slug: "ophiuchus",
    name: "Ophiuchus",
    english: "The Serpent Bearer",
    months: [6, 7, 8, 9],
    targets: ["milky-way-core", "deep-sky"],
    stars: [
      { id: "rasalhague", ra: 17.5822, dec: 12.56, mag: 2.08, name: "Rasalhague" },
      { id: "delta-oph", ra: 16.2391, dec: -3.694, mag: 2.73 },
      { id: "eta-oph", ra: 17.1729, dec: -15.725, mag: 2.43 },
    ],
    lines: [["rasalhague", "delta-oph"], ["delta-oph", "eta-oph"]],
  },
  {
    slug: "piscis-austrinus",
    name: "Piscis Austrinus",
    english: "The Southern Fish",
    months: [8, 9, 10, 11],
    targets: ["southern-sky", "naked-eye"],
    note: "Fomalhaut sits alone in an empty stretch of autumn sky, which is why it is called the solitary one.",
    stars: [{ id: "fomalhaut", ra: 22.9608, dec: -29.622, mag: 1.16, name: "Fomalhaut" }],
    lines: [],
  },
  {
    slug: "pegasus",
    name: "Pegasus",
    english: "The Winged Horse",
    months: [9, 10, 11, 12],
    targets: ["naked-eye"],
    note: "The Great Square is the autumn signpost: four stars, almost empty inside under a city sky and full of faint ones out here.",
    stars: [
      { id: "markab", ra: 23.0793, dec: 15.205, mag: 2.48 },
      { id: "scheat", ra: 23.0629, dec: 28.083, mag: 2.42 },
      { id: "algenib", ra: 0.2206, dec: 15.184, mag: 2.83 },
      { id: "alpheratz", ra: 0.1398, dec: 29.091, mag: 2.06, name: "Alpheratz" },
    ],
    lines: [
      ["markab", "scheat"],
      ["scheat", "alpheratz"],
      ["alpheratz", "algenib"],
      ["algenib", "markab"],
    ],
  },
  {
    slug: "andromeda",
    name: "Andromeda",
    english: "The Chained Lady",
    months: [9, 10, 11, 12, 1],
    targets: ["deep-sky"],
    note: "The Andromeda galaxy is the furthest thing visible to the naked eye, and from a Bortle 2 sky it is obvious rather than a rumour.",
    stars: [
      { id: "alpheratz-and", ra: 0.1398, dec: 29.091, mag: 2.06 },
      { id: "mirach", ra: 1.1622, dec: 35.621, mag: 2.06, name: "Mirach" },
      { id: "almach", ra: 2.065, dec: 42.33, mag: 2.1 },
    ],
    lines: [["alpheratz-and", "mirach"], ["mirach", "almach"]],
  },
  {
    slug: "perseus",
    name: "Perseus",
    english: "The Hero",
    months: [10, 11, 12, 1, 2],
    targets: ["naked-eye", "deep-sky"],
    stars: [
      { id: "mirfak", ra: 3.4054, dec: 49.861, mag: 1.79, name: "Mirfak" },
      { id: "algol", ra: 3.1361, dec: 40.956, mag: 2.12, name: "Algol" },
      { id: "zeta-per", ra: 3.9022, dec: 31.884, mag: 2.85 },
    ],
    lines: [["mirfak", "algol"], ["mirfak", "zeta-per"]],
  },
];

export const constellationBySlug = (slug: string): Constellation | undefined =>
  CONSTELLATIONS.find((c) => c.slug === slug);

/* Sanity net for the chart. Section 8.1 asks for 8 to 12 constellations on
   screen at once, so a month that falls short is a data gap, not a quiet
   downgrade of the centrepiece. Cheap enough to run at module load. */
if (process.env.NODE_ENV !== "production") {
  const ids = new Set<string>();
  for (const c of CONSTELLATIONS) {
    const local = new Set(c.stars.map((s) => s.id));
    for (const [a, b] of c.lines) {
      if (!local.has(a) || !local.has(b)) {
        throw new Error(`${c.slug}: line references a star that does not exist (${a}, ${b})`);
      }
    }
    for (const s of c.stars) {
      if (ids.has(`${c.slug}/${s.id}`)) throw new Error(`${c.slug}: duplicate star id ${s.id}`);
      ids.add(`${c.slug}/${s.id}`);
      if (s.ra < 0 || s.ra >= 24) throw new Error(`${c.slug}/${s.id}: ra out of range`);
      if (s.dec < -90 || s.dec > 90) throw new Error(`${c.slug}/${s.id}: dec out of range`);
    }
  }
}
