import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchView } from "@/components/search/SearchView";
import { getCatalog } from "@/lib/catalog";
import { toListItem } from "@/lib/present";
import { dateKey, upcomingNights } from "@/lib/astro";

export const metadata: Metadata = {
  title: "Search / Suhail",
  description:
    "Every dark-sky experience around AlUla, filtered by night, site, sky quality, duration, group size and price.",
};

export const dynamic = "force-dynamic";

export default async function Search() {
  const nights = upcomingNights(60).map(dateKey);
  const { experiences, siteCount, error } = await getCatalog(
    nights[0],
    nights[nights.length - 1],
  );

  const items = experiences.map((e) => toListItem(e, nights[0]));

  return (
    /* useSearchParams needs a Suspense boundary above it, or the whole route
       opts out of static rendering with a build-time error. */
    <Suspense fallback={null}>
      <SearchView items={items} nights={nights} siteCount={siteCount} error={error} />
    </Suspense>
  );
}
