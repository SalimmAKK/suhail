import type { Metadata } from "next";
import { SkyDashboard } from "@/components/sky/SkyDashboard";
import { SITES } from "@/data/sites";
import { dateKey, shortDate, upcomingNights } from "@/lib/astro";
import { getCatalog } from "@/lib/catalog";
import { getSky } from "@/lib/sky/provider";

export const metadata: Metadata = {
  title: "The Sky / Suhail",
  description:
    "What the sky over AlUla is doing tonight: moon, darkness, twilight window, what is up, cloud, and the notable events in the next sixty nights.",
};

export const dynamic = "force-dynamic";

export default async function Sky() {
  const now = new Date();
  const nights = upcomingNights(60).map(dateKey);

  const [sky, catalog] = await Promise.all([
    getSky(now),
    getCatalog(nights[0], nights[nights.length - 1]),
  ]);

  /* "Best sites tonight" is ordered by what is actually bookable rather than
     by a ranking the data cannot support: all four reserves carry the same
     certified Bortle class, so sorting on it would be inventing a difference
     between them. Sites with something running tonight come first, cheapest
     way in leading. */
  const tonight = nights[0];
  const bookableSites = new Set(
    catalog.experiences
      .filter((e) => e.dates.includes(tonight))
      .map((e) => e.site.slug),
  );

  const siteRanking = [...SITES]
    .map((site) => ({
      slug: site.slug,
      name: site.name,
      bortle: site.bortleClass,
      bookableTonight: bookableSites.has(site.slug),
    }))
    .sort((a, b) => Number(b.bookableTonight) - Number(a.bookableTonight));

  return <SkyDashboard sky={sky} siteRanking={siteRanking} dateLabel={shortDate(now)} />;
}
