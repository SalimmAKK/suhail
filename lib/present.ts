import { SITES, type Site } from "@/data/sites";
import { EXPERIENCE_IMAGES } from "@/data/home";
import { EXPERIENCES, type ExperienceCategory } from "@/data/experiences";
import type { CatalogExperience } from "@/lib/catalog";

/* One flat row per bookable thing, built on the server and handed to the
 * client views as plain data.
 *
 * The split views are client components — filters, hover sync and the map all
 * need state — and a client component cannot reach Supabase. Rather than push
 * the whole catalogue shape across that boundary and re-derive labels in three
 * places, the joining and formatting happens once, here.
 *
 * Everything on this type is either a real record or explicitly null. There is
 * no default that stands in for a value the catalogue does not hold: a card
 * with no price renders without one rather than with an invented figure.
 */

export type ListItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  siteSlug: string;
  siteName: string;
  operatorName: string;
  category: ExperienceCategory | null;
  /** invented demo inventory rather than a sourced listing. carried through
      from data/experiences.ts so the UI can say so. */
  fictional: boolean;
  /** `3h`, or `3h 30m`. Null when the listing does not publish a duration. */
  durationLabel: string | null;
  durationMin: number | null;
  priceSar: number | null;
  /** the site's DarkSky-certified class. Not a per-site SQM measurement. */
  bortle: number | null;
  groupMin: number;
  groupMax: number | null;
  /** seats left on the night in question, when that night is known */
  seatsLeft: number | null;
  /** seats left on every open night, for the detail page's date picker */
  seatsByDate: Record<string, number>;
  lat: number | null;
  lng: number | null;
  approximate: boolean;
  image: { src: string; alt: string } | null;
  /** date keys this experience is running on */
  dates: string[];
};

function durationLabel(minutes: number | null): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const siteBySlug = new Map<string, Site>(SITES.map((s) => [s.slug, s]));

/* Category and the fictional flag live in the seed file rather than in
   Postgres: adding two columns would mean a migration the project owner has
   to run by hand, and both are presentational. Joined on slug, which both
   sides key from the same seed, exactly as the site coordinates and images
   already are. */
const seedBySlug = new Map(EXPERIENCES.map((e) => [e.slug, e]));

export function toListItem(experience: CatalogExperience, forDate?: string): ListItem {
  /* The catalogue's site record carries a name and what it is good for; the
     coordinate, elevation and certified class live in data/sites.ts. Joined on
     slug, which both sides key from the same seed. */
  const site = siteBySlug.get(experience.site.slug);
  const seed = seedBySlug.get(experience.slug);
  const plottable = site && site.coordinatePrecision !== "unsourced";

  return {
    id: experience.id,
    slug: experience.slug,
    title: experience.title,
    description: experience.description,
    siteSlug: experience.site.slug,
    siteName: experience.site.name,
    operatorName: experience.operatorName,
    category: seed?.category ?? null,
    fictional: seed?.fictional ?? false,
    durationLabel: durationLabel(experience.durationMin),
    durationMin: experience.durationMin,
    priceSar: experience.priceSar,
    bortle: site?.bortleClass ?? null,
    groupMin: experience.groupMin,
    groupMax: experience.groupMax,
    seatsLeft: forDate ? (experience.slotsByDate[forDate] ?? null) : null,
    seatsByDate: experience.slotsByDate,
    lat: plottable ? site.lat : null,
    lng: plottable ? site.lng : null,
    approximate: site?.coordinatePrecision === "approximate",
    image: EXPERIENCE_IMAGES[experience.slug] ?? null,
    dates: experience.dates,
  };
}

/** Site-level pins for the map, cheapest experience first. */
export function toPins(items: ListItem[]) {
  const bySite = new Map<string, { name: string; lat: number; lng: number; approximate: boolean; priceSar: number | null }>();

  for (const item of items) {
    if (item.lat === null || item.lng === null) continue;
    const existing = bySite.get(item.siteSlug);
    if (!existing) {
      bySite.set(item.siteSlug, {
        name: item.siteName,
        lat: item.lat,
        lng: item.lng,
        approximate: item.approximate,
        priceSar: item.priceSar,
      });
      continue;
    }
    /* the label carries the cheapest way in, which is what "from" means */
    if (item.priceSar !== null && (existing.priceSar === null || item.priceSar < existing.priceSar)) {
      existing.priceSar = item.priceSar;
    }
  }

  return [...bySite.entries()].map(([id, pin]) => ({ id, ...pin }));
}
