import type { Metadata } from "next";
import { Landing, type LandingSite } from "@/components/landing/Landing";
import { OPERATORS } from "@/data/experiences";
import { SITES } from "@/data/sites";
import {
  dateKey,
  eventDateParts,
  parseDateKey,
  shortDate,
  shortDateWithDay,
  upcomingNights,
} from "@/lib/astro";
import { getCatalog } from "@/lib/catalog";
import { getSky } from "@/lib/sky/provider";

export const metadata: Metadata = {
  title: "Suhail · The night sky, booked by the night",
  description:
    "Saudi Arabia's dark-sky reserves around AlUla, surfaced with the sky's actual conditions and made bookable in one flow.",
};

export const dynamic = "force-dynamic";

/* Short place descriptions for the landing's four cells.
 *
 * data/sites.ts holds a fuller paragraph per site, which is right on a site
 * page and too long in a 32ch column. These are cut from those descriptions
 * rather than written fresh, so nothing here claims anything the sourced
 * record does not. */
const BLURB: Record<string, { meta: string; description: string }> = {
  algharameel: {
    meta: "Sandstone fins · 60 km N",
    description:
      "A field of eroded sandstone fins standing out of open sand. The rock gives the sky a foreground.",
  },
  sharaan: {
    meta: "Canyon · 45 min NE",
    description:
      "Canyon walls cut the northern horizon, which makes it the better site when the target is low in the south.",
  },
  manara: {
    meta: "Plateau · observatory building",
    description:
      "The highest and driest of the four. A four-metre telescope is being built here; the observatory is not open yet.",
  },
  "wadi-nakhlah": {
    meta: "Reserve · newest of the four",
    description:
      "Certified alongside Sharaan, sharing six thousand square kilometres of protected sky. The least built on.",
  },
};

export default async function LandingPage() {
  const now = new Date();
  const nights = upcomingNights(60).map(dateKey);
  const tonight = nights[0];

  const [catalog, sky] = await Promise.all([
    getCatalog(tonight, nights[nights.length - 1]),
    getSky(now),
  ]);

  const runningTonight = catalog.experiences.filter((e) => e.dates.includes(tonight));

  /* Every number the landing prints comes from the catalogue. It sits one
     click from the platform, so a hard-coded count here would be visibly
     contradicted by the next page. */
  const prices = runningTonight
    .map((e) => e.priceSar)
    .filter((p): p is number => p !== null);

  const sites: LandingSite[] = SITES.map((site) => {
    const here = runningTonight.filter((e) => e.site.slug === site.slug);
    const from = here.map((e) => e.priceSar).filter((p): p is number => p !== null);
    return {
      slug: site.slug,
      name: site.name,
      meta: BLURB[site.slug]?.meta ?? "",
      description: BLURB[site.slug]?.description ?? site.description,
      bortle: site.bortleClass,
      bookableTonight: here.length,
      fromSar: from.length ? Math.min(...from) : null,
    };
  });

  /* The next new moon out of the events the provider already computes. */
  const newMoon = sky.events.find((e) => e.name === "New moon");

  return (
    <Landing
      stats={{
        siteCount: SITES.length,
        operatorCount: OPERATORS.length,
        bookableTonight: runningTonight.length,
        cheapestSar: prices.length ? Math.min(...prices) : null,
      }}
      sites={sites}
      sky={{
        dateLabel: shortDateWithDay(now),
        shortDate: shortDate(now),
        moonPhrase: sky.moon.phrase,
        illumination: sky.moon.illumination,
        waxing: sky.moon.waxing,
        moonSet: sky.moon.set,
        darkHours: sky.twilight.darkHours,
        bortle: sky.darkness.bortle,
        cloudPercent: sky.cloud.overallPercent,
        seeing: sky.cloud.seeing,
        coreTransit: sky.twilight.milkyWayCoreTransit,
        nextNewMoon: newMoon
          ? (() => {
              const p = eventDateParts(parseDateKey(newMoon.date));
              return `New moon ${p.day} ${p.date}`;
            })()
          : null,
      }}
    />
  );
}
